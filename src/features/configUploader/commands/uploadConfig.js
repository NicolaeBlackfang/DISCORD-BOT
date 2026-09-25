const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { writeData } = require('../../../database');
const { validateConfig } = require('../utils/jsonParser');
const { successEmbed, errorEmbed } = require('../../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('upload-config')
    .setDescription('Upload a JSON config file to update bot settings dynamically.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Config type')
        .setRequired(true)
        .addChoices(
          { name: 'Welcome', value: 'welcome' },
          { name: 'Self Roles', value: 'selfroles' },
          { name: 'Leveling Core', value: 'leveling' },
          { name: 'Rank Card Design', value: 'rankcard' },
          { name: 'Level Up Message', value: 'levelup' }
        )
    )
    .addAttachmentOption((option) =>
      option.setName('file').setDescription('The JSON file to upload').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const type = interaction.options.getString('type');
    const attachment = interaction.options.getAttachment('file');

    if (!attachment.name.endsWith('.json')) {
      return interaction.editReply({ embeds: [errorEmbed('Please upload a valid .json file.')] });
    }

    try {
      const response = await fetch(attachment.url);
      const json = await response.json();

      const validation = validateConfig(type, json);
      if (!validation.valid) {
        return interaction.editReply({ embeds: [errorEmbed(validation.reason)] });
      }

      writeData(type, json);
      return interaction.editReply({
        embeds: [successEmbed(`Configuration for **${type}** updated dynamically!`)]
      });
    } catch (err) {
      return interaction.editReply({ embeds: [errorEmbed('Failed to process JSON file.')] });
    }
  }
};