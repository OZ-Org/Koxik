const Guild = require('../../models/guild');

module.exports = {
    name: 'banguild',
    description: 'Bane uma guilda do bot',
    async execute(message, args) {
        try {

            if (!message.member.roles.cache.get("1265669129608626237")) return;

            // Verifica se os argumentos são válidos
            if (args.length < 1) {
                return message.reply("Uso incorreto do comando. A sintaxe correta é: `!banguild <guildId>`.");
            }

            const guildId = args[0];

            // Busca a guilda no banco de dados
            let guild = await Guild.findOne({ guildId });
            if (!guild) {
                guild = new Guild({ guildId, name: message.guild.name });
            }

            // Atualiza o status de banimento da guilda
            guild.banned = true;
            await guild.save();

            message.reply(`A guilda ${guild.name} foi banida do bot.`);
        } catch (error) {
            console.error("Erro ao processar o comando 'banguild':", error);
            message.channel.send("Houve um erro ao processar o comando.");
        }
    }
};
