const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Stream a track from YouTube or paste a Spotify link bridge')
        .addStringOption(option => 
            option.setName('query').setDescription('Type keywords, paste a YouTube URL, or paste a Spotify Track/Album/Playlist link').setRequired(true)
        ),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: '❌ You must be connected to a voice channel to use this command!', ephemeral: true });

        await interaction.deferReply();
        let searchInput = interaction.options.getString('query');

        if (!interaction.client.queue) interaction.client.queue = new Map();
        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        try {
            let songsToAdd = [];

            // 🌟 NEW SYSTEM: Intercept and decode Spotify Link Data Bridges
            if (searchInput.includes('spotify.com')) {
                // Check if play-dl's internal token manager needs a refresh to fetch Spotify data
                if (play.is_logged_in()) {
                    await play.refreshToken();
                }

                const linkType = play.sp_validate(searchInput);

                // Scenario A: It is a single Spotify Track link
                if (linkType === 'track') {
                    const trackInfo = await play.spotify(searchInput);
                    // Search for the exact Title + Artist match text directly on YouTube
                    const searchResults = await play.search(`${trackInfo.name} ${trackInfo.artists[0].name}`, { limit: 1 });
                    if (searchResults.length > 0) {
                        songsToAdd.push({ title: trackInfo.name, url: searchResults[0].url, duration: searchResults[0].durationRaw });
                    }
                } 
                // Scenario B: It is an entire Spotify Playlist or Album link
                else if (linkType === 'playlist' || linkType === 'album') {
                    const playlistInfo = await play.spotify(searchInput);
                    const allTracks = await playlistInfo.page(1); // Grabs the first page of tracks safely
                    
                    await interaction.editReply({ content: `🔄 Loading tracks from your Spotify collection... Please hold.` });

                    for (const track of allTracks) {
                        const searchResults = await play.search(`${track.name} ${track.artists[0].name}`, { limit: 1 });
                        if (searchResults.length > 0) {
                            songsToAdd.push({ title: track.name, url: searchResults[0].url, duration: searchResults[0].durationRaw });
                        }
                    }
                }
            } 
            // Standard YouTube Handling (Keywords or direct links)
            else {
                let videoInfo = null;
                if (searchInput.includes('youtube.com/watch') || searchInput.includes('youtu.be/')) {
                    let videoId = '';
                    if (searchInput.includes('v=')) videoId = searchInput.split('v=')[1].split('&')[0];
                    else if (searchInput.includes('youtu.be/')) videoId = searchInput.split('youtu.be/')[1].split('?')[0];

                    if (videoId) {
                        const videoSearchResults = await play.search(videoId, { limit: 1 });
                        if (videoSearchResults.length > 0) videoInfo = videoSearchResults[0];
                    }
                }

                if (!videoInfo) {
                    const searchResults = await play.search(searchInput, { limit: 1 });
                    if (searchResults.length === 0) return interaction.editReply({ content: '❌ No matching tracks found.' });
                    videoInfo = searchResults[0];
                }

                songsToAdd.push({ title: videoInfo.title, url: videoInfo.url, duration: videoInfo.durationRaw });
            }

            if (songsToAdd.length === 0) {
                return interaction.editReply({ content: '❌ Failed to extract or bridge music parameters from that link input.' });
            }

            // Queue processing map layout
            if (!serverQueue) {
                const queueConstruct = {
                    textChannel: interaction.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [...songsToAdd],
                    player: createAudioPlayer(),
                    playing: true
                };

                interaction.client.queue.set(interaction.guild.id, queueConstruct);

                try {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                    });
                    queueConstruct.connection = connection;
                    connection.subscribe(queueConstruct.player);

                    playSong(interaction.guild.id, queueConstruct.songs, interaction.client.queue);
                    
                    const firstSong = queueConstruct.songs[0];
                    await interaction.editReply({ content: `🎵 **Started playing:** [${firstSong.title}](${firstSong.url}) ${songsToAdd.length > 1 ? `alongside ${songsToAdd.length - 1} queued playlist tracks!` : ''}` });
                } catch (err) {
                    interaction.client.queue.delete(interaction.guild.id);
                    return interaction.editReply({ content: '❌ Failed to establish link connections to voice channel.' });
                }
            } else {
                serverQueue.songs.push(...songsToAdd);
                return interaction.editReply({ content: `✅ **Added ${songsToAdd.length} track(s) to the active queue!**` });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Structural network failure handling track streams. Try running keyword keywords instead.' });
        }
    }
};

async function playSong(guildId, songs, queueMap) {
    const serverQueue = queueMap.get(guildId);
    if (!songs || songs.length === 0) {
        if (serverQueue && serverQueue.connection) serverQueue.connection.destroy();
        queueMap.delete(guildId);
        return;
    }

    const currentSong = songs[0];

    try {
        // Enforces clean player agent token bypass checks to resolve random YouTube extraction crashes
        const streamPackage = await play.stream(currentSong.url, { 
            quality: 2, 
            seek: 0, 
            htmToken: await play.getFreeToken() 
        });
        
        const resource = createAudioResource(streamPackage.stream, { inputType: streamPackage.type });
        serverQueue.player.play(resource);
        
        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            playSong(guildId, serverQueue.songs, queueMap);
        });
    } catch (e) {
        console.error(e);
        if (serverQueue && serverQueue.textChannel) {
            serverQueue.textChannel.send(`❌ Streaming failure for **${currentSong.title}**. Shifting down list entries...`);
        }
        serverQueue.songs.shift();
        playSong(guildId, serverQueue.songs, queueMap);
    }
}
