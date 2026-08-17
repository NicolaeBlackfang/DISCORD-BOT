const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Search and stream a track directly from YouTube into your voice room')
        .addStringOption(option => 
            option.setName('query').setDescription('Type song name, keywords, or paste a direct YouTube link address').setRequired(true)
        ),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: '❌ You must be connected to a voice channel to use this command!', ephemeral: true });

        await interaction.deferReply();
        let searchInput = interaction.options.getString('query');

        if (!interaction.client.queue) interaction.client.queue = new Map();
        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        try {
            let videoInfo = null;

            // 🌟 LINK BYPASS CONTEXT ENGINE: If user pasted an absolute YouTube/Music link string
            if (searchInput.includes('youtube.com/watch') || searchInput.includes('youtu.be/') || searchInput.includes('music.youtube.com/watch')) {
                // Isolate and strip out the core alphanumeric video ID token parameter cleanly
                let videoId = '';
                if (searchInput.includes('v=')) {
                    const urlParams = searchInput.split('v=')[1];
                    videoId = urlParams.split('&')[0];
                } else if (searchInput.includes('youtu.be/')) {
                    videoId = searchInput.split('youtu.be/')[1].split('?')[0];
                }

                if (videoId) {
                    // Re-route the isolated video ID through the secure search query scraper system instead of fetching the direct URL
                    const videoSearchResults = await play.search(videoId, { limit: 1 });
                    if (videoSearchResults.length > 0) {
                        videoInfo = videoSearchResults[0];
                    }
                }
            }

            // Fallback sequence: If it's a standard text word query or the extraction above didn't return a match
            if (!videoInfo) {
                const searchResults = await play.search(searchInput, { limit: 1 });
                if (searchResults.length === 0) return interaction.editReply({ content: '❌ No matching tracks found.' });
                videoInfo = searchResults[0];
            }

            const song = { title: videoInfo.title, url: videoInfo.url, duration: videoInfo.durationRaw };

            if (!serverQueue) {
                const queueConstruct = {
                    textChannel: interaction.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [],
                    player: createAudioPlayer(),
                    playing: true
                };

                interaction.client.queue.set(interaction.guild.id, queueConstruct);
                queueConstruct.songs.push(song);

                try {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                    });
                    queueConstruct.connection = connection;
                    connection.subscribe(queueConstruct.player);

                    playSong(interaction.guild.id, queueConstruct.songs, interaction.client.queue);
                    await interaction.editReply({ content: `🎵 **Started playing:** [${song.title}](${song.url})` });
                } catch (err) {
                    interaction.client.queue.delete(interaction.guild.id);
                    return interaction.editReply({ content: '❌ Failed to join voice channel.' });
                }
            } else {
                serverQueue.songs.push(song);
                return interaction.editReply({ content: `✅ **Added to queue:** [${song.title}](${song.url})` });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Error gathering track data stream from this target video structure link.' });
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
        // Enforce the layout extractor engine to call a clear, freshly renewed tracking user token
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
        console.error("Audio streaming stream exception:", e);
        if (serverQueue && serverQueue.textChannel) {
            serverQueue.textChannel.send(`❌ Streaming block error for **${currentSong.title}**. Skipping to the next track entry...`);
        }
        serverQueue.songs.shift();
        playSong(guildId, serverQueue.songs, queueMap);
    }
}
