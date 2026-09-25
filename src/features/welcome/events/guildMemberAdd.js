const { EmbedBuilder } = require('discord.js');
const { readData } = require('../../../database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const config = readData('welcome');
    if (!config || !config.channelId) return;

    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    // Select a random banner if an array is defined in welcome.json
    const banners = config.embed?.banners || [];
    const randomBanner = banners.length > 0 
      ? banners[Math.floor(Math.random() * banners.length)] 
      : null;

    // Format text replacements
    const welcomeText = (config.message || 'Welcome {user}!')
      .replace('{user}', `<@${member.id}>`)
      .replace('{user_name}', member.user.username)
      .replace('{server}', member.guild.name);

    // Dynamic avatar of the joining user
    const avatarUrl = member.user.displayAvatarURL({ dynamic: true, size: 512 });

    // Construct the Welcome Embed
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
        .replace('{member_count}', member.guild.memberCount.toString());
      embed.setFooter({ text: footerText });
    }

    // Send the user mention alongside the embed
    await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
  }
};