require('dotenv').config();
const { Client, GatewayIntentBits, Collection, InteractionType } = require('discord.js');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const componentHandler = require('./handlers/componentHandler');
const logger = require('./utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // <--- REQUIRED for prefix commands like ?setnick
    GatewayIntentBits.GuildMembers   // <--- REQUIRED to read/modify member nicknames
  ]
});


client.commands = new Collection();
client.components = new Collection();

(async () => {
  eventHandler(client);
  componentHandler(client);

  client.once('ready', async () => {
    logger.info(`Logged in as ${client.user.tag}`);
    await commandHandler(client);
  });

  client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        logger.error(`Error executing ${interaction.commandName}`, err);
        const reply = { content: 'There was an error executing this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
        else await interaction.reply(reply);
      }
    } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
      const component = client.components.get(interaction.customId);
      if (component) {
        try {
          await component.execute(interaction);
        } catch (err) {
          logger.error(`Error executing component ${interaction.customId}`, err);
        }
      }
    }
  });

  client.login(process.env.DISCORD_TOKEN);
})();