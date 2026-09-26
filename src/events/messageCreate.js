const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bots, system messages, or DMs
    if (message.author.bot || !message.guild) return;

    const prefix = '?';
    if (!message.content.startsWith(prefix)) return;

    // Split prefix and extract command name + args
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'setnick') {
      const newNickname = args.join(' ');
      const member = message.member;

      // 1. Check if user is Server Owner (Discord API forbids bots from editing Server Owner)
      if (message.guild.ownerId === member.id) {
        return message.reply('❌ Discord does not allow bots to change the Server Owner\'s nickname.');
      }

      // 2. Check if bot has "Manage Nicknames" or "Change Nicknames" permission in the server
      const botMember = message.guild.members.me;
      if (!botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
        return message.reply('❌ I am missing the **Manage Nicknames** permission in my server role settings.');
      }

      // 3. Role Hierarchy Check
      if (!member.manageable) {
        return message.reply('❌ I cannot change your nickname because your role is higher than or equal to my highest role! Drag my bot role higher in **Server Settings > Roles**.');
      }

      // 4. Character Limit Check (Discord max nickname length is 32)
      if (newNickname && newNickname.length > 32) {
        return message.reply('❌ Nicknames cannot exceed 32 characters.');
      }

      const oldNickname = member.nickname || member.user.username;

      try {
        // Passing null resets the server nickname back to global username
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

        return message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('setnick error:', error);
        return message.reply(`❌ Failed to update nickname: ${error.message}`);
      }
    }
  }
};