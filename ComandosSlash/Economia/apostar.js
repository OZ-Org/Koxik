const { SlashCommandBuilder } = require('@discordjs/builders');
const User = require('../../models/user.js'); // Assumindo que você tenha um modelo de usuário

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apostar')
        .setDescription('Aposte um valor e veja se você ganha!')
        .setNameLocalizations({
            'en-US': "bet"
        })
        .setDescriptionLocalizations({
            'en-US': "Bet an amount and see if you win!",
        })
        .addIntegerOption(option =>
            option
                .setName('valor')
                .setDescription('O valor que você quer apostar')
                .setRequired(true)
                .setNameLocalizations({
                    "en-US": "value",
                })
                .setDescriptionLocalizations({
                    'en-US': "Amount that will be bet",
                })),
    async execute(interaction) {
        const userId = interaction.user.id;
        const betAmount = interaction.options.getInteger('valor');
        const locale = interaction.locale || 'en-US'; // Pega a localidade do usuário, padrão para 'en'
        
        // Verifica se a localidade está no objeto messages, caso contrário, define como 'en'
        const lang = messages[locale] ? locale : 'en-US';

        // Buscar o usuário no banco de dados
        let user = await User.findOne({ discordId: userId });
        if (!user) {
            // Se o usuário não existir no banco de dados, criar um novo
            user = new User({ discordId: userId, balance: 0 }); // Exemplo: saldo inicial de 1000
            await user.save();
        }

        // Verificar se o usuário tem saldo suficiente
        if (user.balance < betAmount) {
            await interaction.reply({ content: messages[lang].notEnoughBalance, ephemeral: true });
            return;
        }

        // Gerar resultado da aposta
        const isWin = Math.random() < 0.5; // 50% de chance de ganhar

        if (isWin) {
            user.balance += betAmount; // Ganhar o valor apostado
            await interaction.reply(messages[lang].win.replace('{amount}', betAmount).replace('{balance}', user.balance));
        } else {
            user.balance -= betAmount; // Perder o valor apostado
            await interaction.reply(messages[lang].lose.replace('{amount}', betAmount).replace('{balance}', user.balance));
        }

        // Salvar as alterações no banco de dados
        await user.save();
    },
};
