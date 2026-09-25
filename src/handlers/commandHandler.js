const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = async (client) => {
  client.commands = new Map();
  const commandsArray = [];
  const featuresPath = path.join(__dirname, '../features');
  const featureFolders = fs.readdirSync(featuresPath);

  for (const folder of featureFolders) {
    const commandsPath = path.join(featuresPath, folder, 'commands');
    if (fs.existsSync(commandsPath)) {
      const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));
      for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          commandsArray.push(command.data.toJSON());
        }
      }
    }

    // Direct files inside moderation/ feature directory
    if (folder === 'moderation') {
      const modFiles = fs.readdirSync(path.join(featuresPath, folder)).filter((f) => f.endsWith('.js'));
      for (const file of modFiles) {
        const command = require(path.join(featuresPath, folder, file));
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          commandsArray.push(command.data.toJSON());
        }
      }
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log(`[INFO] Registering ${commandsArray.length} application (/) commands...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commandsArray }
    );
    console.log('[INFO] Slash commands deployed successfully.');
  } catch (error) {
    console.error('[ERROR] Command registration failed:', error);
  }
};