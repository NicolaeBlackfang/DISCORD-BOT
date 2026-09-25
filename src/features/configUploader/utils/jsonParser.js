module.exports = {
  validateConfig: (key, json) => {
    if (!json || typeof json !== 'object') return { valid: false, reason: 'Invalid JSON structure.' };

    if (key === 'welcome') {
      if (!json.channelId || !json.message) {
        return { valid: false, reason: 'Welcome JSON requires "channelId" and "message".' };
      }
    } else if (key === 'selfroles') {
      const keys = Object.keys(json);
      if (keys.length === 0) {
        return { valid: false, reason: 'SelfRoles JSON must contain at least one menu key.' };
      }
    } else if (key === 'leveling') {
      if (typeof json.messageXP !== 'number' && typeof json.xpPerMessage !== 'number') {
        return { valid: false, reason: 'Leveling JSON requires "messageXP" or "xpPerMessage".' };
      }
    } else if (key === 'rankcard') {
      if (!json.title) {
        return { valid: false, reason: 'Rank Card JSON requires a "title" field.' };
      }
    } else if (key === 'levelup') {
      if (!json.message) {
        return { valid: false, reason: 'Level Up JSON requires a "message" field.' };
      }
    } else {
      return { valid: false, reason: 'Unknown config type.' };
    }

    return { valid: true };
  }
};