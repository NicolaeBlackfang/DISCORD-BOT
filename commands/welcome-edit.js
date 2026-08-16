const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-edit')
        .setDescription('Open a pop-up window modal to edit welcome text details and banner link'),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const configFile = path.join(__dirname, '../config.json');
        
        // Safe default configuration parameters fallback
        let currentTitle = "Welcome To Our Server";
        let currentMessage = "Thanks For Joining Our Server. We Hope You Enjoy Here";
        let currentBanner = "";

        if (fs.existsSync(configFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                if (config.customTitle) currentTitle = config.customTitle;
                if (config.customMessage) currentMessage = config.customMessage;
                if (config.customBanner) currentBanner = config.customBanner;
            } catch (e) {
                console.error(e);
            }
        }

        const modal = new ModalBuilder()
            .setCustomId('welcome_edit_modal')
            .setTitle('Edit Welcome Card Assets');

        // Box 1: Dynamic Welcome Card Title
        const titleInput = new TextInputBuilder()
            .setCustomId('modal_welcome_title')
            .setLabel('Welcome Card Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Welcome To ${guildname}')
            .setValue(currentTitle)
            .setRequired(true);

        // Box 2: Welcome description text canvas
        const messageInput = new TextInputBuilder()
            .setCustomId('modal_welcome_message')
            .setLabel('Welcome Card Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter greeting text... (You can use dynamic channel tags)')
            .setValue(currentMessage)
            .setRequired(true);

        // Box 3: Custom banner link input
        const bannerInput = new TextInputBuilder()
            .setCustomId('modal_welcome_banner')
            .setLabel('Banner Image URL (Leave blank for folder file)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://imgur.com')
            .setValue(currentBanner)
            .setRequired(false);

        const firstRow = new ActionRowBuilder().addComponents(titleInput);
        const secondRow = new ActionRowBuilder().addComponents(messageInput);
        const thirdRow = new ActionRowBuilder().addComponents(bannerInput);

        modal.addComponents(firstRow, secondRow, thirdRow);

        await interaction.showModal(modal);
    }
};
