const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const User = require('../../models/user');

const pickaxeLevels = {
    wooden: { minerals: ['coal', 'stone'], time: 3, emoji: '<:picaretamadeira:1262199787969708082>', name: 'Picareta de Madeira' },
    stone: { minerals: ['coal', 'stone', 'iron'], time: 5, emoji: '<:picaretapedra:1262199784765264015>', name: 'Picareta de Pedra' },
    iron: { minerals: ['coal', 'stone', 'iron', 'gold'], time: 7, emoji: '<:picaretaferro:1262199780629680228>', name: 'Picareta de Ferro' },
    diamond: { minerals: ['coal', 'stone', 'iron', 'gold', 'diamond'], time: 10, emoji: '<:picaretadiamante:1262199777601257513>', name: 'Picareta de Diamante' },
    netherite: { minerals: ['coal', 'stone', 'iron', 'gold', 'diamond', 'netherite'], time: 15, emoji: '<:picaretanetherite:1262199782097817692>', name: 'Picareta de Netherite' },
};

const miningRewards = {
    coal: { amount: 5, emoji: '⚫', name: 'Carvão' },
    stone: { amount: 1, emoji: '🪨', name: 'Pedra' },
    iron: { amount: 10, emoji: '⚪', name: 'Ferro' },
    gold: { amount: 15, emoji: '🟡', name: 'Ouro' },
    diamond: { amount: 20, emoji: '🔷', name: 'Diamante' },
    netherite: { amount: 30, emoji: '🔳', name: 'Netherite' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minerar')
        .setDescription('Minere recursos no Minecraft.')
        .addStringOption(option =>
            option.setName('tempo')
                .setDescription('Escolha o tempo de mineração')
                .setRequired(true)
                .addChoices([
                    { name: '3 minutos', value: '3' },
                    { name: '5 minutos', value: '5' },
                    { name: '7 minutos', value: '7' },
                    { name: '10 minutos', value: '10' },
                    { name: '15 minutos', value: '15' }
                ])
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const timeOption = interaction.options.getString('tempo');

        let user = await User.findOne({ discordId: userId });

        if (!user) {
            user = new User({ discordId: userId, username: interaction.user.username });
            await user.save();
        }

        const pickaxe = user.pickaxe;

        if (!pickaxe || user.durability <= 0 || pickaxe == null) {
            return interaction.reply({ content: "Você precisa ter uma picareta para minerar.", ephemeral: true });
        }

        const pickaxeInfo = pickaxeLevels[pickaxe];
        const possibleRewards = pickaxeInfo.minerals;
        const miningTime = pickaxeInfo.time;

        if (parseInt(timeOption) > miningTime) {
            return interaction.reply({ content: `Você só pode minerar por até ${miningTime} minutos com a ${pickaxeInfo.name}.`, ephemeral: true });
        }

        const embed = new Discord.EmbedBuilder()
            .setTitle('Minerando...')
            .setDescription(`Você está minerando... ${pickaxeInfo.emoji}`)
            .setColor('#00FF00')
            .setTimestamp()
            .setFooter({ text: "Espere para terminar" });

        const reply = await interaction.reply({ embeds: [embed], fetchReply: true });

        const progressBar = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('progress')
                    .setLabel('Progresso')
                    .setStyle(Discord.ButtonStyle.Primary)
            );

        await reply.edit({ components: [progressBar] });

        const progressButtonFilter = i => i.customId === 'progress' && i.user.id === interaction.user.id;
        const progressButtonCollector = reply.createMessageComponentCollector({
            filter: progressButtonFilter,
            time: timeOption * 60000
        });

        progressButtonCollector.on('collect', async i => {
            const progressEmbed = new Discord.EmbedBuilder()
                .setTitle('Progresso da Mineração')
                .setColor('#00FF00')
                .setDescription(`Tempo restante: ${((timeOption * 60000 - i.createdTimestamp + reply.createdAt) / 1000 / 60).toFixed(2)} minutos`)
                .setFooter({ text: 'Clique em "Progresso" para atualizar.' });

            await i.update({ embeds: [progressEmbed] });
        });

        setTimeout(async () => {
            let minedResources = {};
            for (let i = 0; i < parseInt(timeOption); i++) {
                const resource = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
                const reward = miningRewards[resource];

                if (minedResources[resource]) {
                    minedResources[resource] += reward.amount;
                } else {
                    minedResources[resource] = reward.amount;
                }

                if (!user.minerals.has(resource)) {
                    user.minerals.set(resource, 0);
                }
                user.minerals.set(resource, user.minerals.get(resource) + reward.amount);
            }

            user.durability -= parseInt(timeOption);
            if (user.durability <= 0) {
                user.pickaxe = 'wooden';
                user.durability = 100;
            }

            await user.save();

            const resultEmbed = new Discord.EmbedBuilder()
                .setTitle('Mineração Concluída')
                .setDescription('Você concluiu a mineração e obteve os seguintes recursos:')
                .setColor('#0000FF')
                .setTimestamp();

            for (const resource in minedResources) {
                const reward = miningRewards[resource];
                resultEmbed.addFields({ name: reward.name, value: `${reward.emoji} ${minedResources[resource]}`, inline: true });
            }

            resultEmbed.addFields({ name: 'Durabilidade Restante', value: `${user.durability}`, inline: true });

            progressButtonCollector.stop();
            await interaction.editReply({ embeds: [resultEmbed], components: [] });

            setTimeout(async () => {
                if (reply.editable) {
                    await reply.delete();
                }
            }, 60000);
        }, timeOption * 60000);
    }
};
