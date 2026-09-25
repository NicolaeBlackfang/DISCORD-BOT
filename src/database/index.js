const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const getFilePath = (file) => path.join(dataDir, `${file}.json`);

const readData = (file) => {
  const filePath = getFilePath(file);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
};

const writeData = (file, data) => {
  fs.writeFileSync(getFilePath(file), JSON.stringify(data, null, 2));
};

module.exports = { readData, writeData };