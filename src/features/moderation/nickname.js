const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription("Change or reset a member's nickname in the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((option) =>
      option.setName('target').setDescription('The member whose nickname you want to change').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('nickname').setDescription('The new nickname (leave blank to reset back to original name)').setRequired(false).setMaxLength(32)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for changing the nickname').setRequired(false)
    ),

  async execute(interaction) {
    // Guard against usage outside of a guild
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ This command can only be used inside a server.',
        flags: MessageFlags.Ephemeral
      });
    }

    const targetUser = interaction.options.getUser('target');
    const newNickname = interaction.options.getString('nickname');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    // 1. Guard check: Target exists in guild
    if (!member) {
      return interaction.reply({
        content: '❌ That user is not in this server.',
        flags: MessageFlags.Ephemeral
      });
    }

    // 2. Guard check: Role hierarchy / Bot permissions
    if (!member.manageable) {
      return interaction.reply({
        content: "❌ I cannot change this user's nickname. Their role is higher than mine, or they are the Server Owner.",
        flags: MessageFlags.Ephemeral
      });
    }

    const oldNickname = member.nickname || member.user.username;
    const formattedNewNickname = newNickname || member.user.username;

    // 3. Perform Nickname Change
    try {
      await member.setNickname(newNickname || null, reason);
    } catch (err) {
      return interaction.reply({
        content: `❌ Failed to update nickname: ${err.message}`,
        flags: MessageFlags.Ephemeral
      });
    }

    // 4. Send Direct Message (DM) to the target user
    let dmSent = true;
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`🏷️ Your Nickname Was Changed in ${interaction.guild.name}`)
        .setColor('#5865F2')
        .addFields(
          { name: 'Old Nickname', value: `\`${oldNickname}\``, inline: true },
          { name: 'New Nickname', value: `\`${formattedNewNickname}\``, inline: true },
          { name: 'Action', value: newNickname ? 'Updated' : 'Reset to Default', inline: true },
          { name: 'Reason', value: reason },
          { name: 'Changed By', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch {
      dmSent = false; // Triggered if target has DMs disabled or blocked the bot
    }

    // 5. Send confirmation embed in server channel
    const replyEmbed = new EmbedBuilder()
      .setTitle('🏷️ Nickname Updated')
      .setColor('#57F287')
      .addFields(
        { name: 'Member', value: `<@${targetUser.id}>`, inline: true },
        { name: 'New Nickname', value: `\`${formattedNewNickname}\``, inline: true },
        { name: 'DM Delivered?', value: dmSent ? '✅ Yes' : '❌ No (DMs Closed)', inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [replyEmbed] });
  }
};