const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  successEmbed: (description) => {
    return new EmbedBuilder()
      .setColor(config.successColor)
      .setDescription(`✅ ${description}`);
  },
  errorEmbed: (description) => {
    return new EmbedBuilder()
      .setColor(config.errorColor)
      .setDescription(`❌ ${description}`);
  },
  customEmbed: (title, description, fields = []) => {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();

    if (fields.length) embed.addFields(fields);
    return embed;
  }
};