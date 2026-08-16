const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-edit')
        .setDescription('Open a pop-up window modal to edit welcome text and banner link'),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const configFile = path.join(__dirname, '../config.json');
        let currentMessage = "Thanks For Joining Our Server. We Hope You Enjoy Here";
        let currentBanner = "";

        if (fs.existsSync(configFile)) {
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            if (config.customMessage) currentMessage = config.customMessage;
            if (config.customBanner) currentBanner = config.customBanner;
        }

        // Build the pop-up panel modal
        const modal = new ModalBuilder()
            .setCustomId('welcome_edit_modal')
            .setTitle('Edit Welcome Asset Layout');

        // Create Text Input slot for the welcome message text
        const messageInput = new TextInputBuilder()
            .setCustomId('modal_welcome_message')
            .setLabel('Welcome Card Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter your custom greeting layout message details...')
            .setValue(currentMessage)
            .setRequired(true);

        // Create Text Input slot for the banner link url address 
        const bannerInput = new TextInputBuilder()
            .setCustomId('modal_welcome_banner')
            .setLabel('Banner Image URL (Leave blank for local folder file)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://imgur.com')
            .setValue(currentBanner)
            .setRequired(false);

        const firstRow = new ActionRowBuilder().addComponents(messageInput);
        const secondRow = new ActionRowBuilder().addComponents(bannerInput);

        modal.addComponents(firstRow, secondRow);

        // Launch the visual modal onto the Admin's screen
        await interaction.showModal(modal);
    }
};
