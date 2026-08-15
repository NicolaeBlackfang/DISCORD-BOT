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
            const rulesChannel = config.rulesChannelId ? `<#${config.rulesChannelId}>` : '#rules';
            const rolesChannel = config.rolesChannelId ? `<#${config.rolesChannelId}>` : '#get-roles';
            const generalChannel = config.generalChannelId ? `<#${config.generalChannelId}>` : '#general-chat';

            const bannerFile = new AttachmentBuilder(path.join(__dirname, '../banner.png'), { name: 'welcome-banner.png' });

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#101216')
                .setAuthor({ 
                    name: member.user.username, 
                    iconURL: member.user.displayAvatarURL({ dynamic: true }) 
                })
                .setTitle(`Welcome To ${member.guild.name}`)
                .setDescription(`Thanks For Joining Our Server. We Hope You Enjoy Here`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Make Sure To Check', value: rulesChannel, inline: false },
                    { name: 'Take Your', value: rolesChannel, inline: false },
                    { name: 'Visit Our', value: generalChannel, inline: false }
                )
                .setImage('attachment://welcome-banner.png') 
                .setFooter({ text: `You are member number #${member.guild.memberCount} to join the squad! 🚀` });

            const welcomeMsg = await channel.send({
                content: `welcome ${member}!`,
                embeds: [welcomeEmbed],
                files: [bannerFile]
            });
            await welcomeMsg.react('👋');
        } catch (error) {
            console.error('Failed to dispatch layout embed:', error);
        }
    },
};
