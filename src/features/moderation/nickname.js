const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription("Change a member's server nickname.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((o) => o.setName('target').setDescription('Target user').setRequired(true))
    .addStringOption((o) => o.setName('new_name').setDescription('New nickname (leave empty to reset)').setRequired(false)),

  async execute(interaction) {
    const member = interaction.options.getMember('target');
    const newName = interaction.options.getString('new_name') || null;

    if (!member || !member.manageable) {
      return interaction.reply({ embeds: [errorEmbed('Cannot modify nickname for this user.')], ephemeral: true });
    }

    await member.setNickname(newName);
    return interaction.reply({
      embeds: [successEmbed(`Updated nickname for **${member.user.tag}** to **${newName || 'Default'}**.`)]
    });
  }
};