const { SlashCommandBuilder, ChannelType, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Configure your server welcome room and channel links')
        .addChannelOption(option => option.setName('welcome-channel').setDescription('Where should the bot post welcome cards?').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addChannelOption(option => option.setName('rules-channel').setDescription('Select your Rules channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addChannelOption(option => option.setName('roles-channel').setDescription('Select your Roles/Get-Roles channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addChannelOption(option => option.setName('general-channel').setDescription('Select your General Chat channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addUserOption(option => option.setName('test-user').setDescription('Select a user to instantly test and preview your welcome card layout').setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const configFile = path.join(__dirname, '../config.json');
        const testUser = interaction.options.getChannel('welcome-channel') ? null : interaction.options.getUser('test-user');

        let config = {
            welcomeChannelId: null, rulesChannelId: null, rolesChannelId: null, generalChannelId: null,
            customTitle: "Welcome To Our Server", customMessage: "Thanks For Joining Our Server. We Hope You Enjoy Here", customBanner: ""
        };

        if (fs.existsSync(configFile)) {
            try { config = { ...config, ...JSON.parse(fs.readFileSync(configFile, 'utf8')) }; } catch (e) {}
        }

        if (testUser || (interaction.options.getUser('test-user') && !interaction.options.getChannel('welcome-channel'))) {
            const userObj = interaction.options.getUser('test-user');
            if (!config.welcomeChannelId) return interaction.reply({ content: '❌ Complete your channel setup first.', ephemeral: true });

            const targetChannel = interaction.guild.channels.cache.get(config.welcomeChannelId);
            if (!targetChannel) return interaction.reply({ content: '❌ Welcome channel not found.', ephemeral: true });

            let memberObj;
            try { memberObj = await interaction.guild.members.fetch(userObj.id); } catch { memberObj = interaction.member; }

            await interaction.reply({ content: '🔄 Dispatching simulated welcome greeting...', ephemeral: true });

            const rulesChannel = config.rulesChannelId ? `<#${config.rulesChannelId}>` : '#rules';
            const rolesChannel = config.rolesChannelId ? `<#${config.rolesChannelId}>` : '#get-roles';
            const generalChannel = config.generalChannelId ? `<#${config.generalChannelId}>` : '#general-chat';

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#101216')
                .setAuthor({ name: memberObj.user.username, iconURL: memberObj.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(config.customTitle || `Welcome To ${memberObj.guild.name}`)
                .setDescription(config.customMessage)
                .setThumbnail(memberObj.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Make Sure To Check', value: rulesChannel, inline: false },
                    { name: 'Take Your', value: rolesChannel, inline: false },
                    { name: 'Visit Our', value: generalChannel, inline: false }
                )
                .setFooter({ text: `You are member number #${memberObj.guild.memberCount} to join the squad! 🚀` });

            const files = [];
            if (config.customBanner && config.customBanner.startsWith('http')) {
                welcomeEmbed.setImage(config.customBanner);
            } else {
                const bannerFile = new AttachmentBuilder(path.join(__dirname, '../banner.png'), { name: 'welcome-banner.png' });
                welcomeEmbed.setImage('attachment://welcome-banner.png');
                files.push(bannerFile);
            }

            const testMsg = await targetChannel.send({ content: `welcome ${memberObj}!`, embeds: [welcomeEmbed], files: files });
            await testMsg.react('👋');
            return;
        }

        config.welcomeChannelId = interaction.options.getChannel('welcome-channel').id;
        config.rulesChannelId = interaction.options.getChannel('rules-channel').id;
        config.rolesChannelId = interaction.options.getChannel('roles-channel').id;
        config.generalChannelId = interaction.options.getChannel('general-channel').id;

        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        await interaction.reply({ content: `✅ **Setup Complete!** Channels successfully linked.`, ephemeral: true });
    }
};
