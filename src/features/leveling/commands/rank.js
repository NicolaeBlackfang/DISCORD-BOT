const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readData } = require('../../../database');

function createProgressBar(current, target, filledSymbol = '🟩', emptySymbol = '⬛', totalBars = 10) {
  const percentage = Math.min(Math.max(current / target, 0), 1);
  const filledBars = Math.round(percentage * totalBars);
  const emptyBars = totalBars - filledBars;
  return filledSymbol.repeat(filledBars) + emptySymbol.repeat(emptyBars) + ` ${Math.floor(percentage * 100)}%`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("Check your or another member's level and XP rank.")
    .addUserOption((option) =>
      option.setName('target').setDescription('The member whose rank you want to view').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('target') || interaction.user;
    const levels = readData('levels');
    const coreConfig = readData('leveling');
    const rankConfig = readData('rankcard');

    const multiplier = coreConfig.levelMultiplier || 100;
    const userData = levels[target.id] || { xp: 0, level: 1 };

    const currentLevelXP = (userData.level - 1) * multiplier;
    const nextLevelXP = userData.level * multiplier;
    const progressXP = userData.xp - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;

    const filledSymbol = rankConfig.progressBarFilled || '🟩';
    const emptySymbol = rankConfig.progressBarEmpty || '⬛';
    const progressBar = createProgressBar(progressXP, xpNeeded, filledSymbol, emptySymbol);

    const titleText = (rankConfig.title || '📊 Rank Card - {user_name}')
      .replace('{user_name}', target.username);

    const embed = new EmbedBuilder()
      .setTitle(titleText)
      .setColor(rankConfig.color || '#5865F2')
      .addFields(
        { name: 'Level', value: `\`${userData.level}\``, inline: true },
        { name: 'Total XP', value: `\`${userData.xp}\``, inline: true },
        { name: 'Progress', value: `${progressBar}\n\`${userData.xp} / ${nextLevelXP} XP\`` }
      )
      .setTimestamp();

    if (rankConfig.showAvatar !== false) {
      embed.setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }));
    }

    if (rankConfig.footer) {
      embed.setFooter({ text: rankConfig.footer });
    }

    return interaction.reply({ embeds: [embed] });
  }
};