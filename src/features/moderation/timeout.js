const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a server member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName('target').setDescription('The member to timeout').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription('Timeout duration in minutes')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320) // Max 28 days
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the timeout').setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: 'That user is not in this server.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        content: 'I cannot timeout this user (they may have higher permissions than me).',
        flags: MessageFlags.Ephemeral
      });
    }

    const durationMs = duration * 60 * 1000;

    // Apply timeout
    await member.timeout(durationMs, reason);

    // Attempt to DM the target user
    let dmSent = true;
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`⏳ You were timed out in ${interaction.guild.name}`)
        .setColor('#ED4245')
        .addFields(
          { name: 'Duration', value: `${duration} minute(s)` },
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch {
      dmSent = false;
    }

    // Confirmation message in channel
    const replyEmbed = new EmbedBuilder()
      .setTitle('⏳ Member Timed Out')
      .setColor('#F1C40F')
      .addFields(
        { name: 'Member', value: `<@${targetUser.id}>`, inline: true },
        { name: 'Duration', value: `${duration} min(s)`, inline: true },
        { name: 'DM Delivered?', value: dmSent ? '✅ Yes' : '❌ No (DMs Closed)', inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [replyEmbed] });
  }
};