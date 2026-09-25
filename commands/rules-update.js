const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules-update')
        .setDescription('Open a pop-up window form to instantly edit your existing rules text content')
        .addChannelOption(option => 
            option.setName('channel').setDescription('The text channel where the rules message is located').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addStringOption(option => 
            option.setName('message-id').setDescription('The absolute Message ID string value of the rules embed card').setRequired(true)
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

            const oldEmbed = targetMessage.embeds[0];
            const currentRulesText = oldEmbed.description || '';

            const modal = new ModalBuilder()
                .setCustomId(`rules_update_modal_${channel.id}_${messageId}`)
                .setTitle('Edit Server Rules Text');

            const rulesInput = new TextInputBuilder()
                .setCustomId('modal_edit_rules_content')
                .setLabel('Modify Server Rules Board')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(currentRulesText) 
                .setRequired(true);

            const firstRow = new ActionRowBuilder().addComponents(rulesInput);
            modal.addComponents(firstRow);

            await interaction.showModal(modal);

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Failed to pull message data. Verify that your Channel selection and Message ID match.', ephemeral: true });
        }
    }
};
