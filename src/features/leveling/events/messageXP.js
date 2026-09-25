const { EmbedBuilder } = require('discord.js');
const { readData, writeData } = require('../../../database');

const cooldowns = new Set();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    if (cooldowns.has(userId)) return;

    const coreConfig = readData('leveling');
    const levelUpConfig = readData('levelup');

    const xpToAdd = coreConfig.xpPerMessage || 15;
    const multiplier = coreConfig.levelMultiplier || 100;
    const cooldownTime = (coreConfig.cooldownSeconds || 60) * 1000;

    const levels = readData('levels');
    if (!levels[userId]) levels[userId] = { xp: 0, level: 1 };

    levels[userId].xp += xpToAdd;
    const nextLevelXP = levels[userId].level * multiplier;

    if (levels[userId].xp >= nextLevelXP) {
      levels[userId].level += 1;

      // Construct Dynamic Level Up Embed
      const textMessage = (levelUpConfig.message || 'Congratulations {user}, you reached Level {level}!')
        .replace('{user}', `<@${userId}>`)
        .replace('{user_name}', message.author.username)
        .replace('{level}', levels[userId].level.toString());

      const embed = new EmbedBuilder()
        .setTitle(levelUpConfig.title || '🎉 Level Up!')
        .setDescription(textMessage)
        .setColor(levelUpConfig.color || '#57F287')
        .setTimestamp();

      if (levelUpConfig.banner) {
        embed.setImage(levelUpConfig.banner);
      }

      const announceMode = levelUpConfig.announceChannel || 'current';
      if (announceMode === 'dm') {
        try {
          await message.author.send({ embeds: [embed] });
        } catch {
          await message.channel.send({ content: `<@${userId}>`, embeds: [embed] });
        }
      } else {
        await message.channel.send({ content: `<@${userId}>`, embeds: [embed] });
      }
    }

    writeData('levels', levels);

    cooldowns.add(userId);
    setTimeout(() => cooldowns.delete(userId), cooldownTime);
  }
};