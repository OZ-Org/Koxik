const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Guild = require('../../models/guild');
const User = require('../../models/user');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Tranca o canal para que apenas usuários com permissões específicas possam enviar mensagens.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        let guild = await Guild.findOne({ guildId: interaction.guild.id });
        if (guild && guild.banned) {
            await interaction.reply({ content: "A guilda está banida do bot e você não pode usar este comando.", ephemeral: true });
            return;
        }

        let user = await User.findOne({ discordId: interaction.user.id });
        if (user && user.banned) {
            await interaction.reply({ content: "Você está banido do bot e não pode usar este comando.", ephemeral: true });
            return;
        }

        const channel = interaction.channel;
        try {
            await channel.permissionOverwrites.create(channel.guild.roles.everyone, { 
                SendMessages: false 
            });

            await interaction.reply({ content: 'Canal trancado com sucesso.' });
        } catch (error) {
            console.error('Erro ao trancar o canal:', error);
            await interaction.reply({ content: 'Houve um erro ao trancar o canal.' });
        }
    },
};
