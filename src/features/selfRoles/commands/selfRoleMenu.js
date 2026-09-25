const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { readData } = require('../../../database');
const { errorEmbed } = require('../../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('selfrole-menu')
    .setDescription('Display a custom self-role embed menu.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('menu_id')
        .setDescription('The ID of the menu defined in selfroles.json (e.g., games, food)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const menuId = interaction.options.getString('menu_id').toLowerCase();
    const allConfigs = readData('selfroles');
    const config = allConfigs[menuId];

    if (!config || !config.embed || !config.roles || !config.roles.length) {
      return interaction.reply({
        embeds: [
          errorEmbed(`No self-role menu found with ID \`${menuId}\`. Check your uploaded \`selfroles.json\`.`)
        ],
        ephemeral: true
      });
    }

    // 1. Build Embed from JSON
    const embed = new EmbedBuilder()
      .setTitle(config.embed.title)
      .setDescription(config.embed.description)
      .setColor(config.embed.color || '#5865F2');

    if (config.embed.thumbnail) embed.setThumbnail(config.embed.thumbnail);
    if (config.embed.footer) embed.setFooter({ text: config.embed.footer });

    // 2. Build Interactive Select Menu Options
    const selectOptions = config.roles.map((role) => {
      const option = {
        label: role.label,
        value: role.value,
        description: role.description || ''
      };
      if (role.emoji) option.emoji = role.emoji;
      return option;
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('selfrole_select')
      .setPlaceholder(config.placeholder || 'Select a role...')
      .addOptions(selectOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return interaction.reply({ embeds: [embed], components: [row] });
  }
};