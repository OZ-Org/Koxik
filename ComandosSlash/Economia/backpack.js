const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const User = require("../../models/user.js");

const miningRewards = {
    coal: { amount: 5, emoji: '⚫', name: 'Carvão' },
    stone: { amount: 1, emoji: '🪨', name: 'Pedra' },
    iron: { amount: 10, emoji: '⚪', name: 'Ferro' },
    gold: { amount: 15, emoji: '🟡', name: 'Ouro' },
    diamond: { amount: 20, emoji: '🔷', name: 'Diamante' },
    netherite: { amount: 30, emoji: '🔳', name: 'Netherite' },
};

const pickaxeLevels = {
    wooden: { emoji: '<:picaretamadeira:1262199787969708082>', name: 'Picareta de Madeira' },
    stone: { emoji: '<:picaretapedra:1262199784765264015>', name: 'Picareta de Pedra' },
    iron: { emoji: '<:picaretaferro:1262199780629680228>', name: 'Picareta de Ferro' },
    diamond: { emoji: '<:picaretadiamante:1262199777601257513>', name: 'Picareta de Diamante' },
    netherite: { emoji: '<:picaretanetherite:1262199782097817692>', name: 'Picareta de Netherite' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mochila')
        .setDescription('Comando de teste com subcomandos')
        .setDescriptionLocalizations({
            'en-US': "backpack",
            'es-ES': "bolsa",
            'fr': "cartable"
        })
        .addSubcommand(subcommand =>
            subcommand
                .setName('abrir')
                .setDescription('Abra sua mochila!')
                .setDescriptionLocalizations({
                    'en-US': "open",
                    "es-ES": "abierto",
                    "fr": "ouvrir"
                })
                .setDescriptionLocalizations({
                    'en-US': "Open your backpack!",
                    "es-ES": "¡Abre tu mochila!",
                    "fr": "Ouvrez votre sac à dos !"
                })
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'abrir') {
            const userId = interaction.user.id;

            // Tenta encontrar o usuário no banco de dados
            let user = await User.findOne({ discordId: userId });

            // Se o usuário não existir, cria uma nova conta
            if (!user) {
                user = new User({
                    discordId: userId,
                    username: interaction.user.username,
                    minerals: {},
                    balance: 0,
                    pickaxe: null,
                    durability: 0
                });
                await user.save();
            }

            // Obtém os minerais, saldo e picareta do usuário
            const minerals = user.minerals;
            const balance = user.balance;
            const pickaxe = user.pickaxe;
            const durability = user.durability;

            // Cria a mensagem embed para exibir os minerais, saldo e picareta do usuário
            const embed = new EmbedBuilder()
                .setTitle('Sua Mochila')
                .setDescription('Aqui estão os seus minerais, saldo e picareta atual:')
                .setColor('#00FF00')
                .setTimestamp();

            // Adiciona os minerais à embed
            if (Object.keys(minerals).length > 0) {
                for (const mineral in minerals) {
                    if (miningRewards[mineral]) {
                        const { emoji, name } = miningRewards[mineral];
                        embed.addFields({ name: `${emoji} ${name}`, value: `${minerals[mineral]}`, inline: true });
                    }
                }
            } else {
                embed.addFields({ name: 'Minerais', value: 'Você não possui minerais.', inline: true });
            }

            // Adiciona o saldo à embed
            embed.addFields({ name: 'Saldo', value: `${balance} coins`, inline: true });

            // Adiciona a picareta à embed
            if (pickaxe && durability > 0) {
                const { emoji: pickaxeEmoji, name: pickaxeName } = pickaxeLevels[pickaxe];
                embed.addFields({ name: 'Picareta', value: `${pickaxeEmoji} ${pickaxeName} (Durabilidade: ${durability})`, inline: true });
            } else {
                embed.addFields({ name: 'Picareta', value: 'Você não possui uma picareta ou ela está quebrada.', inline: true });
            }

            // Envia a resposta com a embed
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else return;
    },
};
