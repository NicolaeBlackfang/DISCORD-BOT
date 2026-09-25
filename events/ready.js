const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);

        // Scan your local folder to gather active commands
        const commands = [];
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            commands.push(command.data.toJSON());
        }

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        try {
            console.log('Started overwriting and purging old commands list configuration...');
            
            // 🌟 CRITICAL RE-SYNC PATCH: Fully overrides Discord\'s list with your current local folder files
            await rest.put(
                Routes.applicationCommands(client.user.id), 
                { body: commands }
            );
            
            console.log('Successfully synchronized active application (/) commands.');
        } catch (error) {
            console.error('Failed to sync slash command registry tree:', error);
        }
    },
};
