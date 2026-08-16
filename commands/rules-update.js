const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules-update')
        .setDescription('Update an existing rules embed with new options and an interactive text pop-up')
        .addChannelOption(option => 
            option.setName('channel').setDescription('The text channel where the rules message is located').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addStringOption(option => 
            option.setName('message-id').setDescription('The absolute Message ID of the rules embed card').setRequired(true)
        )
        .addStringOption(option => 
            option.setName('new-title').setDescription('Optional new title header for your rule panel board').setRequired(false)
        )
        .addStringOption(option => 
            option.setName('new-thumbnail-url').setDescription('Optional new image URL link for the right corner thumbnail').setRequired(false)
        )
        .addStringOption(option => 
            option.setName('new-banner-url').setDescription('Optional new image URL link for the bottom wide banner graphic').setRequired(false)
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

            // Extract new options or fall back to what the embed already has right now
            const title = interaction.options.getString('new-title') || oldEmbed.title || 'Server Rules';
            const thumbnailUrl = interaction.options.getString('new-thumbnail-url') || (oldEmbed.thumbnail ? oldEmbed.thumbnail.url : '');
            const bannerUrl = interaction.options.getString('new-banner-url') || (oldEmbed.image ? oldEmbed.image.url : '');

            // Build the modal window layout structure
            const modal = new ModalBuilder()
                .setCustomId(`rules_update_modal_${channel.id}_${messageId}`)
                .setTitle('Edit Server Rules Canvas');

            const rulesInput = new TextInputBuilder()
                .setCustomId('modal_edit_rules_content')
                .setLabel(`Modify Rules for: ${title}`)
                .setStyle(TextInputStyle.Paragraph)
                .setValue(currentRulesText) // 🌟 PRE-FILLS WITH PREVIOUS CONTENT SECURELY
                .setRequired(true);

            const firstRow = new ActionRowBuilder().addComponents(rulesInput);
            modal.addComponents(firstRow);

            // Keep asset overrides safe in the client memory thread for processing during submission
            interaction.client.rulesUpdateMeta = { title, thumbnailUrl, bannerUrl };

            // Flash the modal pop up onto the Admin screen
            await interaction.showModal(modal);

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Failed to pull message data. Verify that your Channel selection and Message ID match.', ephemeral: true });
        }
    }
};
