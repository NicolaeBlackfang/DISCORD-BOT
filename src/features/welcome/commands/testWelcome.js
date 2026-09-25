const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { readData } = require('../../../database');
const { errorEmbed, successEmbed } = require('../../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('Simulates a welcome message event with full embed display.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const config = readData('welcome');

    if (!config || !config.channelId) {
      return interaction.reply({
        embeds: [errorEmbed('No valid welcome configuration found. Upload `welcome.json` first using `/upload-config`.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const channel = interaction.guild.channels.cache.get(config.channelId);
    if (!channel) {
      return interaction.reply({
        embeds: [errorEmbed(`Could not find channel with ID \`${config.channelId}\`.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    // Select a random banner from welcome.json
    const banners = config.embed?.banners || [];
    const randomBanner = banners.length > 0 
      ? banners[Math.floor(Math.random() * banners.length)] 
      : null;

    const welcomeText = (config.message || 'Welcome {user}!')
      .replace('{user}', `<@${interaction.user.id}>`)
      .replace('{user_name}', interaction.user.username)
      .replace('{server}', interaction.guild.name);

    const avatarUrl = interaction.user.displayAvatarURL({ dynamic: true, size: 512 });

    // Construct Embed
    const embed = new EmbedBuilder()
      .setTitle(config.embed?.title || '🎉 Welcome!')
      .setDescription(welcomeText)
      .setColor(config.embed?.color || '#5865F2')
      .setThumbnail(avatarUrl)
      .setTimestamp();

    if (randomBanner) {
      embed.setImage(randomBanner);
    }

    if (config.embed?.footer) {
      const footerText = config.embed.footer
        .replace('{member_count}', interaction.guild.memberCount.toString());
      embed.setFooter({ text: footerText });
    }

    // Post to the target welcome channel
    await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed] });

    return interaction.reply({
      embeds: [successEmbed(`Test welcome embed successfully sent to <#${config.channelId}>!`)],
      flags: MessageFlags.Ephemeral
    });
  }
};