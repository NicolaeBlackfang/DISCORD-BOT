const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { readData, writeData } = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a server member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName('target').setDescription('The member to warn').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the warning').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    // 1. Save to JSON database
    const warnings = readData('warnings') || {};
    if (!warnings[target.id]) warnings[target.id] = [];

    warnings[target.id].push({
      moderatorId: interaction.user.id,
      reason,
      timestamp: new Date().toISOString()
    });
    writeData('warnings', warnings);

    // 2. Attempt to DM the member
    let dmSent = true;
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`⚠️ Warning Received in ${interaction.guild.name}`)
        .setColor('#ED4245')
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Warned By', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await target.send({ embeds: [dmEmbed] });
    } catch {
      dmSent = false; // DM failed due to privacy settings/blocked
    }

    // 3. Respond in channel with DM status
    const replyEmbed = new EmbedBuilder()
      .setTitle('⚠️ Member Warned')
      .setColor('#F1C40F')
      .addFields(
        { name: 'Member', value: `<@${target.id}>`, inline: true },
        { name: 'Total Warnings', value: `\`${warnings[target.id].length}\``, inline: true },
        { name: 'DM Delivered?', value: dmSent ? '✅ Yes' : '❌ No (DMs Closed)', inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [replyEmbed] });
  }
};