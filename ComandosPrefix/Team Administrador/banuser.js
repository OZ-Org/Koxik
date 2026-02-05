const User = require('../../models/user');

module.exports = {
    name: 'banuser',
    description: 'Bane um usuário do bot',
    async execute(message, args) {
        try {

            if (!message.member.roles.cache.get("1265669129608626237")) return;

            // Verifica se os argumentos são válidos
            if (args.length < 1) {
                return message.reply("Uso incorreto do comando. A sintaxe correta é: `!banuser <usuário>`.");
            }

            const userId = args[0].replace(/[<@!>]/g, ''); // Remove caracteres de formatação

            // Busca o usuário no banco de dados
            let user = await User.findOne({ discordId: userId });
            if (!user) {
                return message.reply("Usuário não encontrado no banco de dados.");
            }

            // Atualiza o status de banimento do usuário
            user.banned = true;
            await user.save();

            message.reply(`O usuário ${user.username} foi banido do bot.`);
        } catch (error) {
            console.error("Erro ao processar o comando 'banuser':", error);
            message.channel.send("Houve um erro ao processar o comando.");
        }
    }
};
