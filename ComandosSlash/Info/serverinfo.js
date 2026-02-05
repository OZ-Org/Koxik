const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Mostra informações sobre o servidor.'),
    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setTitle(`Informações do Servidor: ${guild.name}`)
            .addFields(
                { name: 'Dono', value: owner.user.tag, inline: true },
                { name: 'Membros', value: `${guild.memberCount}`, inline: true },
                { name: 'Criado em', value: `${guild.createdAt.toDateString()}`, inline: false }
            )
            .setColor('#00FF00')
            .setThumbnail(guild.iconURL({ dynamic: true }));

        interaction.reply({ embeds: [embed] });
    },
};
