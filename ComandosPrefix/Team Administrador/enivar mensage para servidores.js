const { Client, PermissionFlagsBits,  EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'envmsgsv',
    description: 'Envia uma mensagem para todos os servidores com uma descrição personalizada.',
    aliases: ['enviarmensagemservidores'],
    execute: async (message, args) => {
        // Verifique se o usuário tem permissão para usar este comando
        if (!message.member.roles.cache.get("1265669129608626237")) return;

        // Verifique se uma descrição foi fornecida
        if (args.length < 1) {
            return message.reply('Você precisa fornecer uma descrição para a embed.');
        }

        // Crie a embed com a descrição fornecida
        const embed = new EmbedBuilder()
            .setTitle('Message from the Bot Team - Mensagem da Equipe do bot - Mensaje del equipo de Bot - Message de l\'équipe Bot')
            .setDescription(args.join(' ')) // Une todos os argumentos para formar a descrição
            .setColor('#341109')
            .setTimestamp()

        // Itere sobre todos os servidores
        const guilds = message.client.guilds.cache;
        for (const guild of guilds.values()) {
            // Tente enviar a mensagem para o primeiro canal que o bot pode falar
            const channels = guild.channels.cache.filter(c => c.isTextBased() && c.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages));
            if (channels.size > 0) {
                const channel = channels.first();
                try {
                    await channel.send({ embeds: [embed] });
                    console.log(`Mensagem enviada para o servidor ${guild.name}`);
                } catch (error) {
                    console.error(`Não foi possível enviar a mensagem para o servidor ${guild.name}: ${error}`);
                }
            }
        }
    },
};
