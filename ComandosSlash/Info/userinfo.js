const { SlashCommandBuilder } = require('@discordjs/builders');
const User = require('../../models/user');
const { EmbedBuilder } = require("discord.js");

// Função para formatar números com separadores de milhar
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Mapeamento de insígnias para emojis
const insigniaEmojis = {
    'Developer': '<:Developer:1255246883270561864>',
    'Youtuber': '<:YouTube:1255256246165045309> ',
    'Reportador de Bugs': '<:ReportadorDeBugs:1255256107643834472>',
    'GigaChad': '<:gigachad:1255291627979804764>',
    "Millionaire": "<:premiumormilionare:1265666681502433410>"
    // Adicione mais conforme necessário
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Ver as informações do servidor')
        .addUserOption(opc =>
            opc
            .setName("pessoa")
            .setDescription("Quem voce vera as informacoes")
            .setRequired(false)
        ),
    async execute(interaction) {
        try {
            let pessoa = interaction.options.getUser('pessoa') ?? interaction.user
            // Encontrar o usuário pelo ID do Discord e atualizar suas informações se necessário
            let user = await User.findOneAndUpdate(
                { discordId: pessoa.id },
                { $setOnInsert: { username: pessoa.username, balance: '0', insignias: '' } },
                { new: true, upsert: true }
            );

            // Verificar se o usuário foi encontrado e se possui insígnias
            let insigniasText = '';
            if (user && typeof user.insignias === 'string' && user.insignias.trim().length > 0) {
                const insigniaList = user.insignias.split(',').map(insignia => insignia.trim());
                insigniasText = insigniaList.map(insignia => `${insigniaEmojis[insignia]} ${insignia}`).join(', ');
            } else {
                insigniasText = 'Nenhuma insígnia ainda.';
            }

            // Construir a embed com as informações do usuário
            let embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle("Informações do Usuário")
                .setDescription(`Nome: ${pessoa.username}\nID: ${pessoa.id}\n\nInsígnias:\n${insigniasText}`)
                .addFields({ name: 'Saldo', value: `${formatNumber(user.balance)} coins` })
                .setThumbnail(pessoa.displayAvatarURL({ format: 'png' }));

    await interaction.reply({ embeds: [embed] });
   
        } catch (error) {
            console.error("Erro ao executar o comando 'userinfo':", error);
            await interaction.reply("Houve um erro ao processar o comando.");
        }
    },
};
