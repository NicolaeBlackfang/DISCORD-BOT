const { successEmbed, errorEmbed } = require('../../../utils/embedBuilder');

module.exports = {
  customId: 'selfrole_select',
  async execute(interaction) {
    const roleId = interaction.values[0];
    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) {
      return interaction.reply({
        embeds: [errorEmbed('Role not found on this server. Please contact an administrator.')],
        ephemeral: true
      });
    }

    const hasRole = interaction.member.roles.cache.has(roleId);

    try {
      if (hasRole) {
        await interaction.member.roles.remove(role);
        return interaction.reply({
          embeds: [successEmbed(`Removed **${role.name}** from your roles.`)],
          ephemeral: true
        });
      } else {
        await interaction.member.roles.add(role);
        return interaction.reply({
          embeds: [successEmbed(`Added **${role.name}** to your roles.`)],
          ephemeral: true
        });
      }
    } catch (error) {
      return interaction.reply({
        embeds: [errorEmbed('Failed to update your roles. Ensure the bot has permissions above the target role.')],
        ephemeral: true
      });
    }
  }
};