const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop all music and disconnect the bot'),
    async execute(interaction) {
        const serverQueue = interaction.client.queue?.get(interaction.guild.id);
        if (!serverQueue) return interaction.reply({ content: '❌ The bot is not connected to a voice channel.', ephemeral: true });
        if (!interaction.member.voice.channel) return interaction.reply({ content: '❌ You must be in the voice channel to stop the player!', ephemeral: true });

        serverQueue.songs = []; // Clear the queue completely
        serverQueue.player.stop();
        if (serverQueue.connection) serverQueue.connection.destroy();
        interaction.client.queue.delete(interaction.guild.id);

        return interaction.reply({ content: '🛑 **Music stopped completely.** Queue cleared, bot disconnected.' });
    }
};
