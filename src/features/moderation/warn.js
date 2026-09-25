const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { readData, writeData } = require('../../database');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user for rule violations.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('target').setDescription('Target user').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for warning').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    const warnings = readData('warnings');
    if (!warnings[target.id]) warnings[target.id] = [];

    warnings[target.id].push({ reason, date: new Date().toISOString(), moderator: interaction.user.id });
    writeData('warnings', warnings);

    return interaction.reply({
      embeds: [successEmbed(`Warned **${target.tag}**.\n**Reason:** ${reason}\n**Total Warnings:** ${warnings[target.id].length}`)]
    });
  }
};