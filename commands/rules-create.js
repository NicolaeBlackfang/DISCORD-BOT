const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules-create')
        .setDescription('Create a beautiful rules embed in a specified channel')
        .addChannelOption(option => 
            option.setName('target-channel')
                .setDescription('Where should the rules be posted?')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const targetChannel = interaction.options.getChannel('target-channel');

        // Build the text area form modal window
        const modal = new ModalBuilder()
            .setCustomId(`rules_create_modal_${targetChannel.id}`)
            .setTitle('Create Your Server Rules');

        // Box 1: Title input field
        const titleInput = new TextInputBuilder()
            .setCustomId('modal_rules_title')
            .setLabel('Rules Embed Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., SERVER RULES')
            .setValue('Server Rules')
            .setRequired(true);

        // Box 2: Rules description text canvas field
        const rulesInput = new TextInputBuilder()
            .setCustomId('modal_rules_content')
            .setLabel('Rules Description Text')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('1. Be respectful to others\n2. No spam or ads\n3. Enjoy your stay!')
            .setRequired(true);

        // Box 3: Thumbnail link text field
        const thumbnailInput = new TextInputBuilder()
            .setCustomId('modal_rules_thumbnail')
            .setLabel('Thumbnail Image URL (Optional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://imgur.com')
            .setRequired(false);

        // Box 4: Banner link text field
        const bannerInput = new TextInputBuilder()
            .setCustomId('modal_rules_banner')
            .setLabel('Banner Image URL (Optional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://imgur.com')
            .setRequired(false);

        // Discord requires every single input element to sit inside its own unique Row block
        const row1 = new ActionRowBuilder().addComponents(titleInput);
        const row2 = new ActionRowBuilder().addComponents(rulesInput);
        const row3 = new ActionRowBuilder().addComponents(thumbnailInput);
        const row4 = new ActionRowBuilder().addComponents(bannerInput);

        modal.addComponents(row1, row2, row3, row4);

        // Flash the multi-row text modal pop up onto the Admin screen
        await interaction.showModal(modal);
    }
};
