const { SlashCommandBuilder } = require('@discordjs/builders');
const User = require('../../models/user');
const Guild = require('../../models/guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Displays the bot\'s ping information'),
    async execute(interaction) {
        // Verifica se a guilda está banida
        let guild = await Guild.findOne({ guildId: interaction.guild.id });
        if (guild && guild.banned) {
            await interaction.reply({ content: "A guilda está banida do bot e você não pode usar este comando.", ephemeral: true });
            return;
        }

        // Verifica se o usuário está banido
        let user = await User.findOne({ discordId: interaction.user.id });
        if (user && user.banned) {
            await interaction.reply({ content: "Você está banido do bot e não pode usar este comando.", ephemeral: true });
            return;
        }

        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

        const shardId = 0;
        const shardCount = 2;
        const clusterId = 4; 
        
        const pingGateway = interaction.client.ws.ping;
        const pingApi = sent.createdTimestamp - interaction.createdTimestamp;

        const response = `🏓 Pong - Shard ${shardId + 1}/${shardCount} ( Cluster ${clusterId} )\n` +
            `📡 Ping Gateway: ${pingGateway}ms\n` +
            `🔩 Ping Api: ${pingApi}ms\n` +
            '📚 Database: MongoDB, Database Local\n'

        await interaction.editReply(response);
    },
};
