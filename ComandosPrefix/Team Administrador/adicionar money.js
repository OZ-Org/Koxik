const User = require('../../models/user');

module.exports = {
    name: 'addmoney',
    description: 'Adiciona dinheiro a um usuário',
    async execute(message, args) {
        try {

            if (!message.member.roles.cache.get("1265669129608626237")) return;


            // Verifica se os argumentos são válidos
            if (args.length < 2) {
                return message.reply("Uso incorreto do comando. A sintaxe correta é: `!addmoney <usuário> <quantidade>`.");
            }

            const userId = args[0].replace(/[<@!>]/g, ''); // Remove caracteres de formatação
            const amount = parseFloat(args[1]);

            if (isNaN(amount)) {
                return message.reply("Por favor, forneça um valor válido.");
            }

            // Busca o usuário no banco de dados
            let user = await User.findOne({ discordId: userId });
            if (!user) {
                return message.reply("Usuário não encontrado no banco de dados.");
            }

            // Adiciona o dinheiro ao saldo do usuário
            user.balance += amount;
            await user.save();

            message.reply(`Adicionado ${amount} ao saldo de ${user.username}. Novo saldo: ${user.balance}.`);
        } catch (error) {
            console.error("Erro ao processar o comando 'addmoney':", error);
            message.channel.send("Houve um erro ao processar o comando.");
        }
    }
};
