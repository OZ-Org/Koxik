const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Informações do Usuário')
        .setType(ApplicationCommandType.User),
    async execute(interaction) {
        const user = await interaction.client.users.fetch(interaction.targetId);
        await interaction.reply({ content: `>>> Usuário: ${user.tag}\nID: ${user.id}`, ephemeral: true});
    },
};
