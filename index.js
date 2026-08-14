const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// 1. Create a minimal Express app to satisfy Render's HTTP port check
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Bot is alive!');
});

app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
});

// 2. Setup your Discord Bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Required to detect new members
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    const channel = member.guild.channels.cache.get(channelId);
    
    if (channel) {
        try {
            // Send the welcome message and store it in a variable
            const welcomeMsg = await channel.send(`Welcome to the server, ${member}!`);
            
            // Automatically react to that exact message
            await welcomeMsg.react('👋');
        } catch (error) {
            console.error('Failed to send or react to welcome message:', error);
        }
    }
});

// 3. Log in using your token from Render environment variables
client.login(process.env.DISCORD_TOKEN);
