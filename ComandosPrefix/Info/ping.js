const User = require('../../models/user');
const Guild = require('../../models/guild');

module.exports = {
    name: 'ping',
    description: 'Displays the bot\'s ping information',
    aliases: ['latency'],
    execute: async (message, args) => {
        // Verifica se a guilda está banida
        let guild = await Guild.findOne({ guildId: message.guild.id });
        if (guild && guild.banned) {
            message.reply("A guilda está banida do bot e você não pode usar este comando.");
            return;
        }

        // Verifica se o usuário está banido
        let user = await User.findOne({ discordId: message.author.id });
        if (user && user.banned) {
            message.reply("Você está banido do bot e não pode usar este comando.");
            return;
        }

        const sent = await message.channel.send('Pinging...');

        const shardId = message.guild ? message.guild.shardId : 0;
        const shardCount = message.client.ws.shards.size;
        const clusterId = 2; // Substitua isso pelo ID real do cluster se estiver usando um gerenciador de clusters

        const pingGateway = message.client.ws.ping;
        const pingApi = sent.createdTimestamp - message.createdTimestamp;

        const response = `🏓 Pong - Shard ${shardId + 1}/${shardCount} ( Cluster ${clusterId} )\n` +
            `📡 Ping Gateway: ${pingGateway}ms\n` +
            `🔩 Ping Api: ${pingApi}ms\n` + '📚 Database: MongoDB';

        await sent.edit(response);
    },
};
