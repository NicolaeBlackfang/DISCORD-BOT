const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules-create')
        .setDescription('Build a beautiful server rules card using an interactive pop-up text canvas')
        .addChannelOption(option => 
            option.setName('target-channel').setDescription('Where should the rules card be sent?').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addStringOption(option => 
            option.setName('rules-title').setDescription('The title header for your rule panel board (e.g., Server Guidelines)').setRequired(true)
        )
        .addStringOption(option => 
            option.setName('thumbnail-url').setDescription('Optional image URL link for the right corner thumbnail icon').setRequired(false)
        )
        .addStringOption(option => 
            option.setName('banner-url').setDescription('Optional image URL link for the bottom wide banner graphic').setRequired(false)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const targetChannel = interaction.options.getChannel('target-channel');
        const title = interaction.options.getString('rules-title');
        const thumbnailUrl = interaction.options.getString('thumbnail-url') || '';
        const bannerUrl = interaction.options.getString('banner-url') || '';

        // Build the modal pop-up window interface structure layout
        // Custom ID encodes layout specifications so the interaction listener can decode it cleanly later
        const modal = new ModalBuilder()
            .setCustomId(`rules_create_modal_${targetChannel.id}`)
            .setTitle('Write Your Server Rules Canvas');

        const rulesInput = new TextInputBuilder()
            .setCustomId('modal_rules_content')
            .setLabel(`Rules Text for: ${title}`)
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('1. Be respectful to others\n2. No spamming or advertisements\n3. Keep chat friendly...')
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(rulesInput);
        modal.addComponents(firstRow);

        // Temporarily store meta parameters on the client memory thread so the interaction listener can pick them up when submitted
        interaction.client.rulesMeta = { title, thumbnailUrl, bannerUrl };

        // Open the text pop-up form area on the screen
        await interaction.showModal(modal);
    }
};
