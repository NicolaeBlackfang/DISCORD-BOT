const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // --- 1. SLASH COMMANDS ROUTER ---
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

        // --- 2. MODAL FORM RESPONSES ENGINE ---
        if (interaction.isModalSubmit()) {
            const configFile = path.join(__dirname, '../config.json');

            // PIPELINE A: Welcome configuration editor
            if (interaction.customId === 'welcome_edit_modal') {
                let config = { 
                    welcomeChannelId: null, rulesChannelId: null, rolesChannelId: null, generalChannelId: null,
                    customMessage: "Thanks For Joining Our Server. We Hope You Enjoy Here", customBanner: ""
                };
                
                if (fs.existsSync(configFile)) {
                    try { config = { ...config, ...JSON.parse(fs.readFileSync(configFile, 'utf8')) }; } catch (e) {}
                }

                config.customMessage = interaction.fields.getTextInputValue('modal_welcome_message');
                config.customBanner = interaction.fields.getTextInputValue('modal_welcome_banner');
                
                fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
                return interaction.reply({ content: `✅ **Welcome Card Assets Updated Successfully!**`, ephemeral: true });
            }

            // PIPELINE B: Rules initialization builder (Reads all 4 modal boxes)
            if (interaction.customId.startsWith('rules_create_modal_')) {
                const targetChannelId = interaction.customId.replace('rules_create_modal_', '');
                const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
                
                // Extract strings from the four input elements securely
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

                // Inject URL image components if provided inside the modal text boxes
                if (thumbnailUrl && thumbnailUrl.startsWith('http')) rulesEmbed.setThumbnail(thumbnailUrl);
                if (bannerUrl && bannerUrl.startsWith('http')) rulesEmbed.setImage(bannerUrl);

                try {
                    const sentMessage = await targetChannel.send({ embeds: [rulesEmbed] });
                    return interaction.reply({ 
                        content: `✅ **Rules successfully posted!**\n• Channel: <#${targetChannel.id}>\n• Message ID: \`${sentMessage.id}\``, 
                        ephemeral: true 
                    });
                } catch (error) {
                    console.error(error);
                    return interaction.reply({ content: '❌ Failed to send embed message to target text room.', ephemeral: true });
                }
            }

            // PIPELINE C: Rules description upgrade modifier (Keeps old layout formatting intact)
            if (interaction.customId.startsWith('rules_update_modal_')) {
                const rawParams = interaction.customId.replace('rules_update_modal_', '');
                const underscoreIndex = rawParams.indexOf('_');
                
                const channelId = rawParams.substring(0, underscoreIndex);
                const messageId = rawParams.substring(underscoreIndex + 1);
                
                const channel = interaction.guild.channels.cache.get(channelId);
                const updatedRulesContent = interaction.fields.getTextInputValue('modal_edit_rules_content');

                try {
                    const targetMessage = await channel.messages.fetch(messageId);
                    const oldEmbed = targetMessage.embeds[0];

                    // Rebuild the embed while preserving original Title, Thumbnail, and Banner assets
                    const updatedEmbed = EmbedBuilder.from(oldEmbed)
                        .setDescription(updatedRulesContent)
                        .setTimestamp();

                    await targetMessage.edit({ embeds: [updatedEmbed] });
                    return interaction.reply({ content: `✅ **Rules embed updated successfully** in <#${channel.id}>!`, ephemeral: true });

                } catch (error) {
                    console.error(error);
                    return interaction.reply({ content: '❌ Failed to process text updates on the rules card.', ephemeral: true });
                }
            }
        }
    },
};
