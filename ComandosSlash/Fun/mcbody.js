const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios'); // Certifique-se de ter o pacote 'axios' instalado
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mcbody')
        .setDescription('Obtém o corpo inteiro de um jogador do Minecraft')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Nome do jogador')
                .setRequired(true)
        ),
    async execute(interaction) {
        const playerName = interaction.options.getString('player');

        try {
            await interaction.deferReply(); // Defere a resposta para dar mais tempo ao processamento

            const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${playerName}`);
            const data = response.data;

            if (!data || !data.id) {
                await interaction.editReply('Jogador não encontrado. Verifique o nome do jogador e tente novamente.');
                return;
            }

            const playerUUID = data.id;
            const headURL = `https://crafatar.com/renders/body/${playerUUID}?overlay`;
            const file = new Discord.AttachmentBuilder(headURL, { name: 'corpo.png' });

            await interaction.editReply({ content: `Corpo de ${playerName}:`, files: [file] });
        } catch (error) {
            console.error('Erro ao obter a corpo do jogador:', error);
            if (error.response && error.response.status === 429) {
                await interaction.editReply('Muitas solicitações em um curto período. Por favor, tente novamente mais tarde.');
            } else {
                await interaction.editReply('Houve um erro ao processar o comando.');
            }
        }
    },
};
