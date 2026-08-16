const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current music track'),
    async execute(interaction) {
        const serverQueue = interaction.client.queue?.get(interaction.guild.id);
        if (!serverQueue) return interaction.reply({ content: '❌ There is no music playing right now.', ephemeral: true });
        if (!interaction.member.voice.channel) return interaction.reply({ content: '❌ You must be in the voice channel to pause music!', ephemeral: true });

        serverQueue.player.pause();
        return interaction.reply({ content: '⏸️ **Music paused.** Use `/resume` to continue playing!' });
    }
};
