const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user for severe rule violations or violence.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('target').setDescription('Target user').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for ban').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    try {
      await interaction.guild.members.ban(target, { reason });
      return interaction.reply({ embeds: [successEmbed(`Banned **${target.tag}**.\n**Reason:** ${reason}`)] });
    } catch {
      return interaction.reply({ embeds: [errorEmbed('Failed to ban user.')], ephemeral: true });
    }
  }
};