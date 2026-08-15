const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder,
    ChannelType
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
            rulesChannelId: null,
            rolesChannelId: null,
            generalChannelId: null
        };
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// --- Helper function to build the embed payload using precise IDs ---
function generateWelcomePayload(member, config) {
    const rulesChannel = config.rulesChannelId ? `<#${config.rulesChannelId}>` : '#rules';
    const rolesChannel = config.rolesChannelId ? `<#${config.rolesChannelId}>` : '#get-roles';
    const generalChannel = config.generalChannelId ? `<#${config.generalChannelId}>` : '#general-chat';

    const welcomeEmbed = new EmbedBuilder()
        .setColor('#101216')
        .setAuthor({ 
            name: member.user.username, 
            iconURL: member.user.displayAvatarURL({ dynamic: true }) 
        })
        .setTitle(`Welcome To ${member.guild.name}`)
        .setDescription(`Thanks For Joining Our Server. We Hope You Enjoy Here`)
        .setThumbnail(member.guild.iconURL({ dynamic: true }))
        .addFields(
            { name: 'Make Sure To Check', value: rulesChannel, inline: false },
            { name: 'Take Your', value: rolesChannel, inline: false },
            { name: 'Visit Our', value: generalChannel, inline: false }
        )
        // Paste your direct banner link here (ends in .png or .jpg)
        .setImage('https://imgur.com') 
        .setFooter({ text: `You are member number #${member.guild.memberCount} to join the squad! 🚀` });

    return {
        content: `welcome ${member}!`,
        embeds: [welcomeEmbed]
    };
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

// --- 4. REGISTER SLASH COMMAND WITH CHANNEL DROPDOWNS ---
const commands = [
    new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Configure your server welcome room and channel links')
        // Target room where messages will actually be posted
        .addChannelOption(option => 
            option.setName('welcome-channel')
                .setDescription('Where should the bot post welcome cards?')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        // Explicit fields so you can specify exactly which channel goes into the embed fields
        .addChannelOption(option => 
            option.setName('rules-channel')
                .setDescription('Select your Rules channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addChannelOption(option => 
            option.setName('roles-channel')
                .setDescription('Select your Roles/Get-Roles channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addChannelOption(option => 
            option.setName('general-channel')
                .setDescription('Select your General Chat channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        // Admin tester option
        .addUserOption(option => 
            option.setName('test-user')
                .setDescription('Select a user to instantly test and preview your welcome card layout')
                .setRequired(false)
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Successfully registered channel selection fields.');
    } catch (error) {
        console.error(error);
    }
});

// --- 5. HANDLE SLASH COMMAND INTERACTIONS ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'setup-welcome') {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
        }

        const testUser = interaction.options.getUser('test-user');
        let config = loadConfig();

        // SCENARIO A: Admin wants to run a visual test layout
        if (testUser) {
            if (!config.welcomeChannelId) {
                return interaction.reply({ content: '❌ Please complete your channel setup options first.', ephemeral: true });
            }

            const targetChannel = interaction.guild.channels.cache.get(config.welcomeChannelId);
            if (!targetChannel) {
                return interaction.reply({ content: '❌ Welcome channel not found. Please re-run setup.', ephemeral: true });
            }

            let memberObj = interaction.member;
            try { memberObj = await interaction.guild.members.fetch(testUser.id); } catch {}

            await interaction.reply({ content: '🔄 Dispatching simulated welcome greeting...', ephemeral: true });
            
            const payload = generateWelcomePayload(memberObj, config);
            const testMsg = await targetChannel.send(payload);
            await testMsg.react('👋');
            return;
        }

        // SCENARIO B: Saving selected channel dropdown settings
        const welcomeChan = interaction.options.getChannel('welcome-channel');
        const rulesChan = interaction.options.getChannel('rules-channel');
        const rolesChan = interaction.options.getChannel('roles-channel');
        const generalChan = interaction.options.getChannel('general-channel');

        config = {
            welcomeChannelId: welcomeChan.id,
            rulesChannelId: rulesChan.id,
            rolesChannelId: rolesChan.id,
            generalChannelId: generalChan.id
        };

        saveConfig(config);

        await interaction.reply({
            content: `✅ **Setup Complete!** Channels successfully linked:\n• Welcome Output: <#${welcomeChan.id}>\n• Rules: <#${rulesChan.id}>\n• Roles: <#${rolesChan.id}>\n• General: <#${generalChan.id}>\n\n💡 *Tip: Test it immediately by running \`/setup-welcome\` with your name in the test-user setting!*`,
            ephemeral: true
        });
    }
});

// --- 6. ACTUAL WELCOME EVENT FOR NEW ARRIVALS ---
client.on('guildMemberAdd', async (member) => {
    const config = loadConfig();
    if (!config.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) return;

    try {
        const payload = generateWelcomePayload(member, config);
        const welcomeMsg = await channel.send(payload);
        await welcomeMsg.react('👋');
    } catch (error) {
        console.error('Failed to dispatch embed on genuine arrival:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
