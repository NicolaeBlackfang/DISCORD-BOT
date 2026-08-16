const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // 1. ROUTE SYSTEM A: Handles normal slash commands 
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

        // 2. ROUTE SYSTEM B: Handles welcome screen pop-ups
        if (interaction.isModalSubmit()) {
            const fs = require('fs');
            const path = require('path');

            if (interaction.customId === 'welcome_edit_modal') {
                const configFile = path.join(__dirname, '../config.json');
                let config = { welcomeChannelId: null, rulesChannelId: null, rolesChannelId: null, generalChannelId: null };
                if (fs.existsSync(configFile)) config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

                config.customMessage = interaction.fields.getTextInputValue('modal_welcome_message');
                config.customBanner = interaction.fields.getTextInputValue('modal_welcome_banner');
                fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

                return interaction.reply({ content: `✅ **Welcome Card Assets Updated Successfully!**`, ephemeral: true });
            }

            // 3. ROUTE SYSTEM C: Handles `/rules-create` pop-up form completions
            if (interaction.customId.startsWith('rules_create_modal_')) {
                const targetChannelId = interaction.customId.split('_')[3];
                const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
                const rulesContent = interaction.fields.getTextInputValue('modal_rules_content');
                
                // Grab the temporary details we saved during the command run step
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
                        content: `✅ **Rules successfully posted!**\n• Channel: <#${targetChannel.id}>\n• Message ID: \`${sentMessage.id}\` *(Keep this ID handy to modify these rules later!)*`, 
                        ephemeral: true 
                    });
                } catch (error) {
                    console.error(error);
                    return interaction.reply({ content: '❌ Failed to send embed message to target text room.', ephemeral: true });
                }
            }

            // 4. ROUTE SYSTEM D: Handles `/rules-update` pop-up form updates
            if (interaction.customId.startsWith('rules_update_modal_')) {
                const splitData = interaction.customId.split('_');
                const channelId = splitData[3];
                const messageId = splitData[4];
                
                const channel = interaction.guild.channels.cache.get(channelId);
                const updatedRulesContent = interaction.fields.getTextInputValue('modal_edit_rules_content');

                try {
                    const targetMessage = await channel.messages.fetch(messageId);
                    const oldEmbed = targetMessage.embeds[0];

                    // Rebuild the framework layout while replacing the description text smoothly
                    const updatedEmbed = EmbedBuilder.from(oldEmbed)
                        .setDescription(updatedRulesContent)
                        .setTimestamp();

                    await targetMessage.edit({ embeds: [updatedEmbed] });
                    return interaction.reply({ content: `✅ **Rules embed updated successfully** in <#${channel.id}>!`, ephemeral: true });

                } catch (error) {
                    console.error(error);
                    return interaction.reply({ content: '❌ Failed to edit rules card layout message block.', ephemeral: true });
                }
            }
        }
    },
};
