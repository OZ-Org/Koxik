const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abraço')
        .setDescription('Dê um abraço em alguém!')
        .addUserOption(option => 
            option.setName('usuário')
                .setDescription('O usuário que você quer abraçar')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuário');
        await interaction.reply(`${interaction.user} deu um abraço em ${user}! 🤗`);
    },
};
