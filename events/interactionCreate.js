const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try { 
                await command.execute(interaction); 
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
            }
            return;
        }

        if (interaction.isModalSubmit()) {
            const configFile = path.join(__dirname, '../config.json');

            // 🌟 Updated Welcome Setup Modal Submission Processor
            if (interaction.customId === 'welcome_setup_modal') {
                let config = {};
                if (fs.existsSync(configFile)) {
                    try { config = JSON.parse(fs.readFileSync(configFile, 'utf8')); } catch (e) {}
                }

                config.welcomeChannelId = interaction.fields.getTextInputValue('modal_welcome_channel');
                config.customTitle = interaction.fields.getTextInputValue('modal_welcome_title');
                config.customMessage = interaction.fields.getTextInputValue('modal_welcome_message');
                config.customBanner = interaction.fields.getTextInputValue('modal_welcome_banner');
                
                fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
                return interaction.reply({ content: `✅ **Welcome configurations updated successfully!**\n• Output Channel ID: \`${config.welcomeChannelId}\``, ephemeral: true });
            }

            // Rules Create Modal Logic
            if (interaction.customId.startsWith('rules_create_modal_')) {
                const targetChannelId = interaction.customId.replace('rules_create_modal_', '');
                const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
                
                const rulesTitle = interaction.fields.getTextInputValue('modal_rules_title');
                const rulesContent = interaction.fields.getTextInputValue('modal_rules_content');
                const thumbnailUrl = interaction.fields.getTextInputValue('modal_rules_thumbnail');
                const bannerUrl = interaction.fields.getTextInputValue('modal_rules_banner');

                const rulesEmbed = new EmbedBuilder()
                    .setColor('#101216')
                    .setTitle(rulesTitle)
                    .setDescription(rulesContent)
                    .setFooter({ text: `${interaction.guild.name} Official Guidelines 🛡️` })
                    .setTimestamp();

                if (thumbnailUrl && thumbnailUrl.startsWith('http')) rulesEmbed.setThumbnail(thumbnailUrl);
                if (bannerUrl && bannerUrl.startsWith('http')) rulesEmbed.setImage(bannerUrl);

                try {
                    const sentMessage = await targetChannel.send({ embeds: [rulesEmbed] });
                    return interaction.reply({ content: `✅ **Rules successfully posted!**\n• Message ID: \`${sentMessage.id}\``, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    return interaction.reply({ content: '❌ Failed to send embed message data.', ephemeral: true });
                }
            }

            // Rules Update Modal Logic
            if (interaction.customId.startsWith('rules_update_modal_')) {
                const rawParams = interaction.customId.replace('rules_update_modal_', '');
                const underscoreIndex = rawParams.indexOf('_');
                
                const channelId = rawParams.substring(0, underscoreIndex);
                const messageId = rawParams.substring(underscoreIndex + 1);
                
                const channel = interaction.guild.channels.cache.get(channelId);
                const updatedRulesContent = interaction.fields.getTextInputValue('modal_edit_rules_content');

                const meta = (interaction.client.rulesUpdateMeta && interaction.client.rulesUpdateMeta[interaction.user.id])
                    || { title: 'Server Rules', thumbnailUrl: '', bannerUrl: '' };

                try {
                    const targetMessage = await channel.messages.fetch(messageId);
                    const updatedEmbed = new EmbedBuilder()
                        .setColor('#101216')
                        .setTitle(meta.title)
                        .setDescription(updatedRulesContent)
                        .setFooter({ text: `${interaction.guild.name} Official Guidelines 🛡️` })
                        .setTimestamp();

                    if (meta.thumbnailUrl && meta.thumbnailUrl.startsWith('http')) updatedEmbed.setThumbnail(meta.thumbnailUrl);
                    if (meta.bannerUrl && meta.bannerUrl.startsWith('http')) updatedEmbed.setImage(meta.bannerUrl);

                    await targetMessage.edit({ embeds: [updatedEmbed] });
                    return interaction.reply({ content: `✅ **Rules embed updated successfully!**`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    return interaction.reply({ content: '❌ Failed to process text updates on the rules card.', ephemeral: true });
                }
            }
        }
    },
};
