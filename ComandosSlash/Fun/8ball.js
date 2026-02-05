const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Responde a sua pergunta com uma resposta de 8-ball mágica!')
        .addStringOption(option => 
            option.setName('pergunta')
                .setDescription('A pergunta para a 8-ball')
                .setRequired(true)),
    async execute(interaction) {
        const responses = [
            "Com certeza.",
            "Não conte com isso.",
            "Sem dúvidas.",
            "Pergunte novamente mais tarde.",
            "Definitivamente não.",
            "Você pode contar com isso.",
            "Melhor não te dizer agora.",
            "Minhas fontes dizem que não.",
            "Parece bom.",
            "Muito duvidoso."
        ];

        const question = interaction.options.getString('pergunta');
        const response = responses[Math.floor(Math.random() * responses.length)];
        const embed = new Discord.EmbedBuilder()
        .setTitle(`8Ball`)
        .setDescription(`> Pergunta: \`\`\` ${question} \`\`\` \n\n> Resposta: \`\`\` ${response} \`\`\` `)
        interaction.reply({ embeds: [embed], content: `${interaction.user}` });
    },
};
