const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules-update')
        .setDescription('Open a pop-up window form to edit and modify an already existing rules embed')
        .addChannelOption(option => 
            option.setName('channel').setDescription('The text channel where the rules message is currently located').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addStringOption(option => 
            option.setName('message-id').setDescription('The absolute Message ID string value of the bot rules card').setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel');
        const messageId = interaction.options.getString('message-id');

        try {
            const targetMessage = await channel.messages.fetch(messageId);

            if (targetMessage.author.id !== interaction.client.user.id || targetMessage.embeds.length === 0) {
                return interaction.reply({ content: '❌ Could not find a valid bot-sent rules embed with that matching ID.', ephemeral: true });
            }

            const currentRulesText = targetMessage.embeds[0].description || '';

            // Build the edit text panel form pop-up window
            const modal = new ModalBuilder()
                .setCustomId(`rules_update_modal_${channel.id}_${messageId}`)
                .setTitle('Edit Existing Server Rules Text');

            const rulesInput = new TextInputBuilder()
                .setCustomId('modal_edit_rules_content')
                .setLabel('Modify Server Rules Board')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(currentRulesText) // Automatically pre-fills the pop-up text box with your current rules
                .setRequired(true);

            const firstRow = new ActionRowBuilder().addComponents(rulesInput);
            modal.addComponents(firstRow);

            await interaction.showModal(modal);

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Failed to pull message data. Double-check your Channel selection and Message ID string value.', ephemeral: true });
        }
    }
};
