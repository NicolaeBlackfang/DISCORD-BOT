const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('resume').setDescription('Resume the paused music track'),
    async execute(interaction) {
        const serverQueue = interaction.client.queue?.get(interaction.guild.id);
        if (!serverQueue) return interaction.reply({ content: '❌ There is no music playing right now.', ephemeral: true });
        if (!interaction.member.voice.channel) return interaction.reply({ content: '❌ You must be in the voice channel to resume music!', ephemeral: true });

        serverQueue.player.unpause();
        return interaction.reply({ content: '▶️ **Music resumed!** Enjoy the tracks.' });
    }
};
