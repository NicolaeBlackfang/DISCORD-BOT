const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('target').setDescription('Target user').setRequired(true))
    .addIntegerOption((o) => o.setName('minutes').setDescription('Duration in minutes').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for timeout')),

  async execute(interaction) {
    const member = interaction.options.getMember('target');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    if (!member || !member.moderatable) {
      return interaction.reply({ embeds: [errorEmbed('Cannot timeout this user.')], ephemeral: true });
    }

    await member.timeout(minutes * 60 * 1000, reason);
    return interaction.reply({
      embeds: [successEmbed(`Timed out **${member.user.tag}** for ${minutes} minutes.\n**Reason:** ${reason}`)]
    });
  }
};