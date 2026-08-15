const { SlashCommandBuilder, ChannelType, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Configure your server welcome room and channel links')
        .addChannelOption(option => 
            option.setName('welcome-channel').setDescription('Where should the bot post welcome cards?').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addChannelOption(option => 
            option.setName('rules-channel').setDescription('Select your Rules channel').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addChannelOption(option => 
            option.setName('roles-channel').setDescription('Select your Roles/Get-Roles channel').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addChannelOption(option => 
            option.setName('general-channel').setDescription('Select your General Chat channel').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addUserOption(option => 
            option.setName('test-user').setDescription('Select a user to instantly test and preview your welcome card layout').setRequired(false)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const configFile = path.join(__dirname, '../config.json');
        const testUser = interaction.options.getUser('test-user');

        // Handle Admin testing simulator
        if (testUser) {
            if (!fs.existsSync(configFile)) return interaction.reply({ content: '❌ Complete your channel setup first.', ephemeral: true });
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

            const targetChannel = interaction.guild.channels.cache.get(config.welcomeChannelId);
            if (!targetChannel) return interaction.reply({ content: '❌ Welcome channel not found.', ephemeral: true });

            let memberObj = interaction.member;
            try { memberObj = await interaction.guild.members.fetch(testUser.id); } catch {}

            await interaction.reply({ content: '🔄 Dispatching simulated welcome greeting...', ephemeral: true });

            const rulesChannel = config.rulesChannelId ? `<#${config.rulesChannelId}>` : '#rules';
            const rolesChannel = config.rolesChannelId ? `<#${config.rolesChannelId}>` : '#get-roles';
            const generalChannel = config.generalChannelId ? `<#${config.generalChannelId}>` : '#general-chat';
            const bannerFile = new AttachmentBuilder(path.join(__dirname, '../banner.png'), { name: 'welcome-banner.png' });

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#101216')
                .setAuthor({ name: memberObj.user.username, iconURL: memberObj.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`Welcome To ${memberObj.guild.name}`)
                .setDescription(`Thanks For Joining Our Server. We Hope You Enjoy Here`)
                .setThumbnail(memberObj.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Make Sure To Check', value: rulesChannel, inline: false },
                    { name: 'Take Your', value: rolesChannel, inline: false },
                    { name: 'Visit Our', value: generalChannel, inline: false }
                )
                .setImage('attachment://welcome-banner.png') 
                .setFooter({ text: `You are member number #${memberObj.guild.memberCount} to join the squad! 🚀` });

            const testMsg = await targetChannel.send({ content: `welcome ${memberObj}!`, embeds: [welcomeEmbed], files: [bannerFile] });
            await testMsg.react('👋');
            return;
        }

        // Handle saving channel configuration options
        const welcomeChan = interaction.options.getChannel('welcome-channel');
        const rulesChan = interaction.options.getChannel('rules-channel');
        const rolesChan = interaction.options.getChannel('roles-channel');
        const generalChan = interaction.options.getChannel('general-channel');

        const config = {
            welcomeChannelId: welcomeChan.id,
            rulesChannelId: rulesChan.id,
            rolesChannelId: rolesChan.id,
            generalChannelId: generalChan.id
        };

        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

        await interaction.reply({
            content: `✅ **Setup Complete!** Channels successfully linked.`,
            ephemeral: true
        });
    }
};
