const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Search and stream a track directly from YouTube into your voice room')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('Type song name, keywords, or paste a direct YouTube link address')
                .setRequired(true)
        ),
    async execute(interaction) {
        // 1. Ensure the user is physically standing inside a server voice lounge
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: '❌ You must be connected to a voice channel to use this command!', ephemeral: true });
        }

        // 2. Acknowledge interaction quickly to bypass Discord's 3-second timeout constraint
        await interaction.deferReply();
        const searchInput = interaction.options.getString('query');

        try {
            // 3. Perform a fast network scan to find matching audio tracks
            let videoInfo = null;
            let streamUrl = searchInput;

            if (!searchInput.startsWith('http')) {
                // If keywords are provided instead of a direct link, fetch the top search result
                const searchResults = await play.search(searchInput, { limit: 1 });
                if (searchResults.length === 0) {
                    return interaction.editReply({ content: '❌ No matching tracks found for your query terms.' });
                }
                videoInfo = searchResults[0];
                streamUrl = videoInfo.url;
            } else {
                // If a direct URL link was pasted, scrape the target data layout details directly
                const videoDetails = await play.video_basic_info(searchInput);
                videoInfo = videoDetails.video_details;
            }

            // 4. Establish a raw streaming data channel request profile from YouTube
            const streamPackage = await play.stream(streamUrl, { quality: 2 });

            // 5. Connect the bot seamlessly to the user's voice room canvas channel target
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            // 6. Build the audio engine frameworks inside system memory
            const player = createAudioPlayer();
            const resource = createAudioResource(streamPackage.stream, { inputType: streamPackage.type });

            // 7. Inject audio pipeline data blocks straight into the live player channel
            player.play(resource);
            connection.subscribe(player);

            // Send confirmation embed summary data details into the server text space
            await interaction.editReply({ 
                content: `🎵 **Now Playing:** [${videoInfo.title}](${videoInfo.url})\n⏱️ *Duration: ${videoInfo.durationRaw}*` 
            });

            // Auto-disconnect from channel memory lines if the player becomes completely idle
            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

        } catch (error) {
            console.error('Music stream execution crash error:', error);
            await interaction.editReply({ content: '❌ Failed to connect or stream audio data blocks cleanly inside this channel frame.' });
        }
    }
};
