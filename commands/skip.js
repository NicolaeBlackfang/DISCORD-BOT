const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song in the queue'),
    async execute(interaction) {
        const serverQueue = interaction.client.queue?.get(interaction.guild.id);
        if (!serverQueue) return interaction.reply({ content: '❌ There are no tracks in the queue to skip.', ephemeral: true });
        if (!interaction.member.voice.channel) return interaction.reply({ content: '❌ You must be in the voice channel to skip tracks!', ephemeral: true });

        serverQueue.player.stop(); // Stops current song, automatically triggers the Idle event to play the next one
        return interaction.reply({ content: '⏭️ **Skipped!** Fetching the next song in the queue...' });
    }
};
