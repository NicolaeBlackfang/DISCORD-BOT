require('dotenv').config(); // Required for reading local .env tokens safely
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Web server for Render port checks
const app = express();
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(PORT, () => console.log(`Web server listening on port ${PORT}`));

// Setup client - clean intent profile with explicit status presence tracking
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers
    ],
    // 🌟 THE HANDSHAKE FIX: Injects an instant status state alongside the first connection signal
    presence: {
        status: 'online',
        activities: [{
            name: 'Managing setups 🛡️',
            type: 0 // Playing status type
        }]
    }
});

// Dynamic storage handles for commands
client.commands = new Collection();

// Auto-load all Event files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Auto-load all Command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

// 🌟 THE PATH CHECK LOG: Verifies that your Environment Variables are functioning
if (!process.env.DISCORD_TOKEN) {
    console.error("❌ CRITICAL ERROR: DISCORD_TOKEN is missing or undefined in your Environment Settings!");
} else {
    console.log("🔑 Token variable found. Initializing login connection thread...");
}

client.login(process.env.DISCORD_TOKEN);
