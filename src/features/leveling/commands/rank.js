const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readData } = require('../../../database');
const { getRequiredXP } = require('../utils/addXP');

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

    const baseMultiplier = coreConfig.levelMultiplier || 100;
    const userData = levels[target.id] || { xp: 0, level: 1 };

    const currentLevel = userData.level;
    const currentLevelBaseXP = getRequiredXP(currentLevel - 1, baseMultiplier);
    const nextLevelTargetXP = getRequiredXP(currentLevel, baseMultiplier);

    const progressXP = Math.max(0, userData.xp - currentLevelBaseXP);
    const xpNeededForNext = Math.max(1, nextLevelTargetXP - currentLevelBaseXP);

    const filledSymbol = rankConfig.progressBarFilled || '🟩';
    const emptySymbol = rankConfig.progressBarEmpty || '⬛';
    const progressBar = createProgressBar(progressXP, xpNeededForNext, filledSymbol, emptySymbol);

    const titleText = (rankConfig.title || '📊 Rank Card - {user_name}')
      .replace('{user_name}', target.username);

    const embed = new EmbedBuilder()
      .setTitle(titleText)
      .setColor(rankConfig.color || '#5865F2')
      .addFields(
        { name: 'Level', value: `\`${currentLevel}\``, inline: true },
        { name: 'Total XP', value: `\`${userData.xp}\``, inline: true },
        { name: 'Progress to Level ' + (currentLevel + 1), value: `${progressBar}\n\`${userData.xp} / ${nextLevelTargetXP} XP\`` }
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