const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ChannelSelectMenuBuilder, 
    ChannelType,
    ComponentType
} = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATION STORAGE ---
const CONFIG_FILE = path.join(__dirname, 'config.json');

function loadConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
        return { 
            welcomeChannelId: null, 
            welcomeMessageLines: [
                "⚔️ A wild ${usermention} appeared!",
                "",
                "Welcome to **${guildname}**! Glad you made it to the lobby."
            ] 
        };
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// --- 2. EXPRESS WEB SERVER (For Render) ---
const app = express();
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(PORT, () => console.log(`Web server listening on port ${PORT}`));

// --- 3. DISCORD CLIENT SETUP ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// --- 4. REGISTER SLASH COMMAND ---
const commands = [
    new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Set up the welcome channel (Uses your pre-defined JSON layout format)')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Successfully registered /setup-welcome command.');
    } catch (error) {
        console.error(error);
    }
});

// --- 5. HANDLE SLASH COMMAND & CHANNEL DROPDOWN ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'setup-welcome') {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        // Dropdown menu for selecting a channel
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('welcome_channel_select')
            .setPlaceholder('Choose the channel for your customized JSON welcome message...')
            .addChannelTypes(ChannelType.GuildText);

        const row = new ActionRowBuilder().addComponents(channelSelect);

        const response = await interaction.reply({
            content: `⚙️ **Welcome Message Setup**\nSelect the channel where your structured text template should be posted:`,
            components: [row],
            ephemeral: true
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.ChannelSelect,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'welcome_channel_select') {
                const selectedChannelId = i.values[0];
                
                // Hardcode your specific JSON layout block here so it saves safely
                const config = {
                    welcomeChannelId: selectedChannelId,
                    welcomeMessageLines: [
                        "⚔️ A wild ${usermention} appeared!",
                        "",
                        "Welcome to **${guildname}**! Glad you made it to the lobby.",
                        "",
                        "Your Next Quests:📍",
                        "Step 1: Check out the rules to keep the lobby friendly.🎭 ",
                        "Step 2: Unlock your channels in #get-roles.💬 ",
                        "Step 3: Introduce yourself in #general-chat and start leveling up!",
                        "",
                        "You are member number #${guildmembercount} to join the squad! 🚀",
                        ""
                    ]
                };
                
                saveConfig(config);

                await i.update({
                    content: `✅ **Setup complete!** The JSON template is active and linked to <#${selectedChannelId}>.`,
                    components: []
                });
            }
        });
    }
});

// --- 6. PARSE PLACEHOLDERS AND SEND WELCOME MESSAGE ---
client.on('guildMemberAdd', async (member) => {
    const config = loadConfig();
    
    if (!config.welcomeChannelId || !config.welcomeMessageLines) return;

    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    
    if (channel) {
        try {
            // Join the array lines together with proper line breaks (\n)
            let fullTemplate = config.welcomeMessageLines.join('\n');

            // Safely swap out all placeholders for current user/server stats
            fullTemplate = fullTemplate.replace(/\${usermention}/g, `${member}`);
            fullTemplate = fullTemplate.replace(/\${guildname}/g, `${member.guild.name}`);
            fullTemplate = fullTemplate.replace(/\${guildmembercount}/g, `${member.guild.memberCount}`);

            // Send processed text block and react with a wave emoji
            const welcomeMsg = await channel.send({ content: fullTemplate });
            await welcomeMsg.react('👋');
            
        } catch (error) {
            console.error('Failed to parse or deliver layout text:', error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
