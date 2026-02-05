const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js")
module.exports = {
    data: new SlashCommandBuilder()
        .setName("dado")
        .setDescription("Gire um dado de 20 lados"),
    async execute(interaction) {
        const dado = Math.floor(Math.random() * 20) + 1;
        await interaction.reply({ content: `O dado caiu em: ${dado}`, ephemeral: true })
    },
};
