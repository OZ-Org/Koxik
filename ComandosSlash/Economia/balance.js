const { SlashCommandBuilder } = require('@discordjs/builders');
const User = require('../../models/user');
const Guild = require('../../models/guild');

// Função para formatar números com separadores de milhar
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your balance')
        .setNameLocalizations({
            "pt-BR": "dinheiro"
        }),
    async execute(interaction) {
        console.log('Executing balance command for user:', interaction.user.id);

        // Verifica se a guilda está banida
        let guild = await Guild.findOne({ guildId: interaction.guild.id });
        if (guild && guild.banned) {
            await interaction.reply({ content: "A guilda está banida do bot e você não pode usar este comando.", ephemeral: true });
            return;
        }

        // Procura o usuário e cria um novo registro se não existir
        let user = await User.findOneAndUpdate(
            { discordId: interaction.user.id },
            { $setOnInsert: { username: interaction.user.username, balance: 0, banned: false } },
            { new: true, upsert: true }
        );

        if (user.banned) {
            await interaction.reply({ content: "Você está banido do bot e não pode usar este comando.", ephemeral: true });
        } else {
            await interaction.reply({ content: `${interaction.user.username}, seu saldo é ${formatNumber(user.balance)} moedas.`, ephemeral: true });
        }
    },
};
