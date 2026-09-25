const timestamp = () => `[${new Date().toISOString()}]`;

module.exports = {
  info: (msg) => console.log(`${timestamp()} [INFO] ${msg}`),
  warn: (msg) => console.warn(`${timestamp()} [WARN] ${msg}`),
  error: (msg, err) => console.error(`${timestamp()} [ERROR] ${msg}`, err || '')
};