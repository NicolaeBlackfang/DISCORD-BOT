const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const featuresPath = path.join(__dirname, '../features');
  const featureFolders = fs.readdirSync(featuresPath);

  for (const folder of featureFolders) {
    const eventsPath = path.join(featuresPath, folder, 'events');
    if (fs.existsSync(eventsPath)) {
      const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));
      for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }
      }
    }
  }
};