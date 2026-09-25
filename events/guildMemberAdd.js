const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const configFile = path.join(__dirname, '../config.json');
        if (!fs.existsSync(configFile)) return;

        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        if (!config.welcomeChannelId) return;

        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (!channel) return;

        try {
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#101216')
                .setAuthor({ 
                    name: member.user.username, 
                    iconURL: member.user.displayAvatarURL({ dynamic: true }) 
                })
                .setTitle(config.customTitle || `Welcome To ${member.guild.name}`)
                .setDescription(config.customMessage || "Thanks For Joining Our Server. We Hope You Enjoy Here")
                
                // 🌟 THUMBNAIL LOGO AUTOMATICALLY MAPS TO JOINED USER PROFILE ICON
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                
                // 🌟 FOOTER AUTOMATICALLY CONTINUES TRACKING TOTAL GUILD SQUAD MEMBERS COUNT
                .setFooter({ text: `You are member number #${member.guild.memberCount} to join the squad! 🚀` });

            const files = [];
            if (config.customBanner && config.customBanner.startsWith('http')) {
                welcomeEmbed.setImage(config.customBanner);
            } else {
                const bannerFile = new AttachmentBuilder(path.join(__dirname, '../banner.png'), { name: 'welcome-banner.png' });
                welcomeEmbed.setImage('attachment://welcome-banner.png');
                files.push(bannerFile);
            }

            const welcomeMsg = await channel.send({
                content: `welcome ${member}!`,
                embeds: [welcomeEmbed],
                files: files
            });
            await welcomeMsg.react('👋');
        } catch (error) {
            console.error('Failed to dispatch layout embed:', error);
        }
    },
};
