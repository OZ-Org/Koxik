const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js")
const Guild = require('../../models/guild');
const User = require('../../models/user');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Define o prefixo do bot para a guilda.')
        .addStringOption(option =>
            option.setName('prefix')
                .setDescription('O novo prefixo para o bot.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

      if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: 'Você não tem permissão para usar esse comando!', ephemeral: true });
        }

        const newPrefix = interaction.options.getString('prefix');

        try {
            if (!guild) {
                guild = new Guild({
                    guildId,
                    name: interaction.guild.name,
                    prefix: newPrefix
                });
            } else {
                guild.prefix = newPrefix;
            }

            await guild.save();
            await interaction.reply({ content: `Prefixo alterado para \`${newPrefix}\` com sucesso!`, ephemeral: true });
        } catch (error) {
            console.error('Erro ao definir o prefixo:', error);
            await interaction.reply('Houve um erro ao definir o prefixo.');
        }
    },
};
