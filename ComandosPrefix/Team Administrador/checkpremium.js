const Guild = require('../../models/guild');

module.exports = {
    name: 'checkpremium',
    description: 'Verifica se a guilda é premium',
    async execute(message) {
        try {
            // Verifica se a mensagem foi enviada em um servidor (guilda)
            if (!message.guild) {
                return message.reply("Este comando só pode ser usado em servidores.");
            }

            // Busca a guilda no banco de dados
            let guild = await Guild.findOne({ guildId: message.guild.id });
            if (!guild) {
                return message.reply("Esta guilda não está registrada no banco de dados.");
            }

            // Verifica se a guilda é premium
            if (guild.premium) {
                message.reply("Esta guilda é premium.");
            } else {
                message.reply("Esta guilda não é premium.");
            }
        } catch (error) {
            console.error("Erro ao processar o comando 'checkpremium':", error);
            message.channel.send("Houve um erro ao processar o comando.");
        }
    }
};
