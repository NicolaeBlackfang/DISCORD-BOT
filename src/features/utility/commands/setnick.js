const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setnick')
    .setDescription('Change or reset your own server nickname.')
    .addStringOption((option) =>
      option
        .setName('nickname')
        .setDescription('Your new nickname (leave blank to reset back to original name)')
        .setRequired(false)
        .setMaxLength(32) // Discord nickname character limit
    ),

  async execute(interaction) {
    const newNickname = interaction.options.getString('nickname');
    const member = interaction.member;

    // Check if the bot has permission to manage this specific member's nickname
    if (!member.manageable) {
      return interaction.reply({
        content: '❌ I cannot change your nickname because your role is higher than mine or you are the Server Owner.',
        flags: MessageFlags.Ephemeral
      });
    }

    const oldNickname = member.nickname || member.user.username;

    try {
      // Passing null or empty string resets the nickname back to global username
      await member.setNickname(newNickname || null);

      const updatedNickname = newNickname || member.user.username;

      const embed = new EmbedBuilder()
        .setTitle('🏷️ Nickname Updated')
        .setColor('#57F287')
        .setDescription(
          newNickname
            ? `Your nickname has been changed from \`${oldNickname}\` to \`${updatedNickname}\`.`
            : `Your nickname has been reset back to your original username (\`${updatedNickname}\`).`
        )
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      return interaction.reply({
        content: `❌ Failed to update nickname: ${error.message}`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};