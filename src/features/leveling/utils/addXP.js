const { EmbedBuilder } = require('discord.js');
const { readData, writeData } = require('../../../database');

// Helper to calculate required XP for a given level
function getRequiredXP(level, baseMultiplier = 100) {
  // Uses progressive curve: Base * (Level ^ 1.5)
  return Math.floor(baseMultiplier * Math.pow(level, 1.5));
}

async function grantXP(userId, amount, channel, userAuthor, guild) {
  const coreConfig = readData('leveling');
  const levelUpConfig = readData('levelup');

  const baseMultiplier = coreConfig.levelMultiplier || 100;
  const maxLevel = coreConfig.maxLevel || 100;
  const roleRewards = coreConfig.roleRewards || {};

  const levels = readData('levels');
  if (!levels[userId]) levels[userId] = { xp: 0, level: 1 };

  // Stop granting XP if max level reached
  if (levels[userId].level >= maxLevel) return;

  levels[userId].xp += amount;
  let currentLevel = levels[userId].level;
  let nextLevelXP = getRequiredXP(currentLevel, baseMultiplier);

  // Loop in case user earns enough XP to jump multiple levels
  let leveledUp = false;
  while (levels[userId].xp >= nextLevelXP && currentLevel < maxLevel) {
    currentLevel += 1;
    leveledUp = true;
    nextLevelXP = getRequiredXP(currentLevel, baseMultiplier);

    // Auto-assign role reward if configured for this level
    if (guild && roleRewards[currentLevel.toString()]) {
      const roleId = roleRewards[currentLevel.toString()];
      const role = guild.roles.cache.get(roleId);
      if (role) {
        try {
          const member = await guild.members.fetch(userId);
          if (member && !member.roles.cache.has(roleId)) {
            await member.roles.add(role);
          }
        } catch (err) {
          console.error(`Failed to assign role reward for level ${currentLevel}:`, err);
        }
      }
    }
  }

  if (leveledUp) {
    levels[userId].level = currentLevel;

    // Build level up announcement
    const textMessage = (levelUpConfig.message || 'Congratulations {user}, you reached Level {level}!')
      .replace('{user}', `<@${userId}>`)
      .replace('{user_name}', userAuthor ? userAuthor.username : 'Member')
      .replace('{level}', currentLevel.toString());

    const embed = new EmbedBuilder()
      .setTitle(levelUpConfig.title || '🎉 Level Up!')
      .setDescription(textMessage)
      .setColor(levelUpConfig.color || '#57F287')
      .setTimestamp();

    if (levelUpConfig.banner) embed.setImage(levelUpConfig.banner);

    if (channel) {
      try {
        await channel.send({ content: `<@${userId}>`, embeds: [embed] });
      } catch (err) {
        console.error('Failed to send level up message:', err);
      }
    }
  }

  writeData('levels', levels);
}

module.exports = { grantXP, getRequiredXP };