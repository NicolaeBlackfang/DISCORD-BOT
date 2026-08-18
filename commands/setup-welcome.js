const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Open a pop-up window modal to fully configure the welcome system and template layouts')
        .addUserOption(option => 
            option.setName('test-user').setDescription('Select a user to instantly test and preview your welcome card layout').setRequired(false)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const configFile = path.join(__dirname, '../config.json');
        const testUser = interaction.options.getUser('test-user');

        // Fast In-Memory Default fallbacks (Bypasses drive read latency spikes)
        let currentChannel = "";
        let currentTitle = "Welcome To Our Server";
        let currentMessage = "Thanks For Joining Our Server. We Hope You Enjoy Here";
        let currentBanner = "";

        // Only block execution to read disk files if absolutely required
        if (fs.existsSync(configFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                if (config.welcomeChannelId) currentChannel = config.welcomeChannelId;
                if (config.customTitle) currentTitle = config.customTitle;
                if (config.customMessage) currentMessage = config.customMessage;
                if (config.customBanner) currentBanner = config.customBanner;
            } catch (e) {
                console.error(e);
            }
        }

        // Handle Test User Preview Flow
        if (testUser) {
            if (!currentChannel) return interaction.reply({ content: '❌ Complete your configuration popup first by running `/setup-welcome` without choosing a user.', ephemeral: true });
            
            const targetChannel = interaction.guild.channels.cache.get(currentChannel);
            if (!targetChannel) return interaction.reply({ content: '❌ Configured welcome channel was not found.', ephemeral: true });

            let memberObj;
            try { memberObj = await interaction.guild.members.fetch(testUser.id); } catch { memberObj = interaction.member; }

            await interaction.reply({ content: '🔄 Dispatching simulated welcome greeting...', ephemeral: true });

            const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#101216')
                .setAuthor({ name: memberObj.user.username, iconURL: memberObj.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(currentTitle)
                .setDescription(currentMessage)
                .setThumbnail(memberObj.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ text: `You are member number #${memberObj.guild.memberCount} to join the squad! 🚀` });

            const files = [];
            if (currentBanner && currentBanner.startsWith('http')) {
                welcomeEmbed.setImage(currentBanner);
            } else {
                const bannerFile = new AttachmentBuilder(path.join(__dirname, '../banner.png'), { name: 'welcome-banner.png' });
                welcomeEmbed.setImage('attachment://welcome-banner.png');
                files.push(bannerFile);
            }

            const testMsg = await targetChannel.send({ content: `welcome ${memberObj}!`, embeds: [welcomeEmbed], files: files });
            await testMsg.react('👋');
            return;
        }

        // Instantly generate UI Modal fields to return to Discord under 3 seconds
        const modal = new ModalBuilder()
            .setCustomId('welcome_setup_modal')
            .setTitle('Configure Welcome System');

        const channelInput = new TextInputBuilder()
            .setCustomId('modal_welcome_channel')
            .setLabel('Welcome Channel ID')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Paste the Channel ID here...')
            .setValue(currentChannel)
            .setRequired(true);

        const titleInput = new TextInputBuilder()
            .setCustomId('modal_welcome_title')
            .setLabel('Welcome Embed Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Welcome to our home!')
            .setValue(currentTitle)
            .setRequired(true);

        const messageInput = new TextInputBuilder()
            .setCustomId('modal_welcome_message')
            .setLabel('Welcome Embed Description Text')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Type your description greetings layout text here...')
            .setValue(currentMessage)
            .setRequired(true);

        const bannerInput = new TextInputBuilder()
            .setCustomId('modal_welcome_banner')
            .setLabel('Banner Image URL (Blank for folder file)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://imgur.com')
            .setValue(currentBanner)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(channelInput),
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(messageInput),
            new ActionRowBuilder().addComponents(bannerInput)
        );

        // Flash modal instantly
        await interaction.showModal(modal);
    }
};
