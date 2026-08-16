const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // --- 1. SLASH COMMAND ROUTER ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try { await command.execute(interaction); } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
            }
            return;
        }

        // --- 2. MODAL FORM POP-UP SUBMISSIONS ROUTER ---
        if (interaction.isModalSubmit()) {
            const configFile = path.join(__dirname, '../config.json');

            // Welcome Edit Modal Logic
            if (interaction.customId === 'welcome_edit_modal') {
                let config = { welcomeChannelId: null, rulesChannelId: null, rolesChannelId: null, generalChannelId: null };
                if (fs.existsSync(configFile)) config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

                config.customMessage = interaction.fields.getTextInputValue('modal_welcome_message');
                config.customBanner = interaction.fields.getTextInputValue('modal_welcome_banner');
                fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

                return interaction.reply({ content: `✅ **Welcome Card Assets Updated Successfully!**`, ephemeral: true });
            }

            // Rules Create Modal Logic
            if (interaction.customId.startsWith('rules_create_modal_')) {
                const targetChannelId = interaction.customId.replace('rules_create_modal_', '');
                const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
                const rulesContent = interaction.fields.getTextInputValue('modal_rules_content');
                
                const meta = interaction.client.rulesMeta || { title: 'Server Rules', thumbnailUrl: '', bannerUrl: '' };

                const rulesEmbed = new EmbedBuilder()
                    .setColor('#101216')
                    .setTitle(meta.title)
                    .setDescription(rulesContent)
                    .setFooter({ text: `${interaction.guild.name} Official Guidelines 🛡️` })
                    .setTimestamp();

                if (meta.thumbnailUrl && meta.thumbnailUrl.startsWith('http')) rulesEmbed.setThumbnail(meta.thumbnailUrl);
                if (meta.bannerUrl && meta.bannerUrl.startsWith('http')) rulesEmbed.setImage(meta.bannerUrl);

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

            // 🌟 Upgraded Rules Update Modal Logic
            if (interaction.customId.startsWith('rules_update_modal_')) {
                const rawParams = interaction.customId.replace('rules_update_modal_', '');
                const underscoreIndex = rawParams.indexOf('_');
                
                const channelId = rawParams.substring(0, underscoreIndex);
                const messageId = rawParams.substring(underscoreIndex + 1);
                
                const channel = interaction.guild.channels.cache.get(channelId);
                const updatedRulesContent = interaction.fields.getTextInputValue('modal_edit_rules_content');

                // Grab the text, title, thumbnail and banner configurations passed or retained
                const meta = interaction.client.rulesUpdateMeta || { title: 'Server Rules', thumbnailUrl: '', bannerUrl: '' };

                try {
                    const targetMessage = await channel.messages.fetch(messageId);

                    // Rebuild the fresh canvas entirely using the new variable matrix 
                    const updatedEmbed = new EmbedBuilder()
                        .setColor('#101216')
                        .setTitle(meta.title)
                        .setDescription(updatedRulesContent) // Injects your edited text
                        .setFooter({ text: `${interaction.guild.name} Official Guidelines 🛡️` })
                        .setTimestamp();

                    if (meta.thumbnailUrl && meta.thumbnailUrl.startsWith('http')) {
                        updatedEmbed.setThumbnail(meta.thumbnailUrl);
                    }
                    if (meta.bannerUrl && meta.bannerUrl.startsWith('http')) {
                        updatedEmbed.setImage(meta.bannerUrl);
                    }

                    await targetMessage.edit({ embeds: [updatedEmbed] });
                    return interaction.reply({ content: `✅ **Rules embed updated successfully** in <#${channel.id}>!`, ephemeral: true });

                } catch (error) {
                    console.error(error);
                    return interaction.reply({ content: '❌ Failed to update the live rules card layout.', ephemeral: true });
                }
            }
        }
    },
};
