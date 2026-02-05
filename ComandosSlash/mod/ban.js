const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js'); // Para verificar permissões
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bane um membro do servidor!")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("O usuário a ser banido")
                .setRequired(true) // Torna obrigatório escolher um usuário
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Motivo do banimento")
                .setRequired(false) // Motivo é opcional
        ),
    async execute(interaction) {
        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "Sem motivo fornecido";
        const member = interaction.guild.members.cache.get(user.id);

        // Verificar se o autor tem permissão para banir
        if (!interaction.member.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) {
            return interaction.reply({ content: "Você não tem permissão para banir membros!", ephemeral: true });
        }

        // Verificar se o bot tem permissão para banir
        if (!interaction.guild.me.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) {
            return interaction.reply({ content: "Eu não tenho permissão para banir membros!", ephemeral: true });
        }

        if (!member.bannable) {
            return interaction.reply({ content: "Não consigo banir esse usuário!", ephemeral: true });
        }

        await member.ban({ reason })
            .then(() => {
                interaction.reply({ content: `${user.tag} foi banido com sucesso! Motivo: ${reason}` });
            })
            .catch(err => {
                console.error(err);
                interaction.reply({ content: "Ocorreu um erro ao tentar banir o usuário.", ephemeral: true });
            });
    },
};
