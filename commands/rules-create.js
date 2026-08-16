const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules-create')
        .setDescription('Create a beautiful rules embed using an interactive text pop-up')
        .addChannelOption(option => 
            option.setName('target-channel').setDescription('Where should the rules be posted?').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addStringOption(option => 
            option.setName('rules-title').setDescription('The title for your rules board (e.g., Server Rules)').setRequired(true)
        )
        .addStringOption(option => 
            option.setName('thumbnail-url').setDescription('Optional direct image URL for the right-hand thumbnail icon').setRequired(false)
        )
        .addStringOption(option => 
            option.setName('banner-url').setDescription('Optional direct image URL for the bottom large banner graphic').setRequired(false)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const targetChannel = interaction.options.getChannel('target-channel');
        const title = interaction.options.getString('rules-title');
        const thumbnailUrl = interaction.options.getString('thumbnail-url') || '';
        const bannerUrl = interaction.options.getString('banner-url') || '';

        // Build the text area form modal window
        const modal = new ModalBuilder()
            .setCustomId(`rules_create_modal_${targetChannel.id}`)
            .setTitle('Write Your Server Rules Canvas');

        const rulesInput = new TextInputBuilder()
            .setCustomId('modal_rules_content')
            .setLabel(`Rules Text for: ${title}`)
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('1. Be respectful to others\n2. No spam or ads\n3. Enjoy your stay!')
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(rulesInput);
        modal.addComponents(firstRow);

        // Keep image properties safe in the client memory thread for processing during submission
        interaction.client.rulesMeta = { title, thumbnailUrl, bannerUrl };

        // Flash the text modal pop up onto the Admin screen
        await interaction.showModal(modal);
    }
};
