const { SlashCommandBuilder } = require('@discordjs/builders');
const User = require('../../models/user');
const Guild = require('../../models/guild');

// Função para formatar números com separadores de milhar
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Earn coins by working'),
    async execute(interaction) {
        // Verifica se a guilda está banida
        let guild = await Guild.findOne({ guildId: interaction.guild.id });
        if (guild && guild.banned) {
            await interaction.reply({ content: "A guilda está banida do bot e você não pode usar este comando.", ephemeral: true });
            return;
        }

        // Procura o usuário no banco de dados
        let user = await User.findOne({ discordId: interaction.user.id });

        // Verifica se o usuário está banido
        if (user && user.banned) {
            await interaction.reply({ content: "Você está banido do bot e não pode usar este comando.", ephemeral: true });
            return;
        }

        const earnings = Math.floor(Math.random() * 100) + 1; // Ganha entre 1 e 100 moedas

        if (!user) {
            user = new User({
                discordId: interaction.user.id,
                username: interaction.user.username,
                balance: earnings,
            });
        } else {
            user.balance += earnings;
        }

        await user.save();
        await interaction.reply(`${interaction.user.username}, você trabalhou duro e ganhou ${earnings} moedas! Seu novo saldo é ${formatNumber(user.balance)} moedas.`);
    },
};
