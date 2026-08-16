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
        const searchInput = interaction.options.getString('query');

        if (!interaction.client.queue) interaction.client.queue = new Map();
        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        try {
            let videoInfo = null;
            let streamUrl = searchInput;

            if (!searchInput.startsWith('http')) {
                const searchResults = await play.search(searchInput, { limit: 1 });
                if (searchResults.length === 0) return interaction.editReply({ content: '❌ No matching tracks found.' });
                videoInfo = searchResults[0];
                streamUrl = videoInfo.url;
            } else {
                const videoDetails = await play.video_basic_info(searchInput);
                videoInfo = videoDetails.video_details;
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

                    playSong(interaction.guild.id, queueConstruct.songs[0], interaction.client.queue);
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
            await interaction.editReply({ content: '❌ Error gathering track data stream.' });
        }
    }
};

async function playSong(guildId, song, queueMap) {
    const serverQueue = queueMap.get(guildId);
    if (!song) {
        serverQueue.connection.destroy();
        queueMap.delete(guildId);
        return;
    }

    try {
        const streamPackage = await play.stream(song.url, { quality: 2, seek: 0, htmToken: await play.getFreeToken() });
        const resource = createAudioResource(streamPackage.stream, { inputType: streamPackage.type });
        
        serverQueue.player.play(resource);
        
        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            playSong(guildId, serverQueue.songs[0], queueMap);
        });
    } catch (e) {
        console.error(e);
        serverQueue.textChannel.send('❌ Audio pipeline encountered an extraction failure.');
        serverQueue.songs.shift();
        playSong(guildId, serverQueue.songs[0], queueMap);
    }
}
