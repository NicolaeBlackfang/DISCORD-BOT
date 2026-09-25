const { readData } = require('../../../database');
const { grantXP } = require('../utils/addXP');

const cooldowns = new Set();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    if (cooldowns.has(userId)) return;

    const coreConfig = readData('leveling');
    const xpToAdd = coreConfig.messageXP || coreConfig.xpPerMessage || 15;
    const cooldownTime = (coreConfig.messageCooldownSeconds || coreConfig.cooldownSeconds || 30) * 1000;

    await grantXP(userId, xpToAdd, message.channel, message.author, message.guild);

    cooldowns.add(userId);
    setTimeout(() => cooldowns.delete(userId), cooldownTime);
  }
};