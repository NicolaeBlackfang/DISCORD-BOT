const { readData } = require('../../../database');
const { grantXP } = require('../utils/addXP');

// Map to store active voice timers: userId -> setInterval handle
const voiceTimers = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const member = newState.member;
    if (!member || member.user.bot) return;

    const userId = member.id;
    const config = readData('leveling');

    const voiceXP = config.voiceXPPerMinute || 10;
    const intervalSeconds = config.voiceXPIntervalSeconds || 60;
    const ignoreMuted = config.ignoreMutedVoice !== false; // Default: true

    const isConnected = !!newState.channelId;
    const isMuted = newState.mute || newState.selfMute || newState.deaf || newState.selfDeaf;

    // Helper to stop tracking a user
    const stopTracking = () => {
      if (voiceTimers.has(userId)) {
        clearInterval(voiceTimers.get(userId));
        voiceTimers.delete(userId);
      }
    };

    // User left voice or joined AFK channel
    if (!isConnected || newState.channelId === newState.guild.afkChannelId) {
      return stopTracking();
    }

    // If configured to ignore muted users and user is muted
    if (ignoreMuted && isMuted) {
      return stopTracking();
    }

    // Start interval if not already active
    if (!voiceTimers.has(userId)) {
      const timer = setInterval(async () => {
        // Re-check channel and state before granting XP
        const currentGuildMember = newState.guild.members.cache.get(userId);
        if (!currentGuildMember || !currentGuildMember.voice.channelId) {
          return stopTracking();
        }

        if (ignoreMuted && (currentGuildMember.voice.mute || currentGuildMember.voice.selfMute)) {
          return;
        }

        // Find a text channel to announce level-up if needed (e.g. system channel or first text channel)
        const targetTextChannel = newState.guild.systemChannel || 
          newState.guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));

        await grantXP(userId, voiceXP, targetTextChannel, member.user);
      }, intervalSeconds * 1000);

      voiceTimers.set(userId, timer);
    }
  }
};