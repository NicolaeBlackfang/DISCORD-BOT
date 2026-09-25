const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.components = new Map();
  const featuresPath = path.join(__dirname, '../features');
  const featureFolders = fs.readdirSync(featuresPath);

  for (const folder of featureFolders) {
    const componentsPath = path.join(featuresPath, folder, 'components');
    if (fs.existsSync(componentsPath)) {
      const componentFiles = fs.readdirSync(componentsPath).filter((f) => f.endsWith('.js'));
      for (const file of componentFiles) {
        const component = require(path.join(componentsPath, file));
        if (component.customId) {
          client.components.set(component.customId, component);
        }
      }
    }
  }
};