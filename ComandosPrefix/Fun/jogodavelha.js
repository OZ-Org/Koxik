const { TicTacToe } = require('discord-gamecord');
const Guild = require('../../models/guild');
const User = require('../../models/user');

module.exports = {
    name: 'jogodavelha',
    description: 'Inicie um jogo de Tic Tac Toe!',
    aliases: ['jogo-da-velha'],
    execute: async (message, args) => {
        try {
            // Verifica se a guilda está banida
            let guild = await Guild.findOne({ guildId: message.guild.id });
            if (guild && guild.banned) {
                message.reply("A guilda está banida do bot e você não pode usar este comando.");
                return;
            }

            // Procura o usuário no banco de dados
            let user = await User.findOne({ discordId: message.author.id });

            // Verifica se o usuário está banido
            if (user && user.banned) {
                message.reply("Você está banido do bot e não pode usar este comando.");
                return;
            }

            const opponent = message.mentions.users.first();
            if (!opponent) {
                message.reply("Você precisa mencionar um usuário para jogar.");
                return;
            }

            const game = new TicTacToe({
                message: message,
                opponent: opponent,
                embed: {
                    title: 'Jogo de Tic Tac Toe',
                    color: '#5865F2',
                    OverTitle: 'Fim de Jogo',
                },
                emojis: {
                    xEmoji: '❌',
                    oEmoji: '⭕',
                    blankEmoji: '➖',
                },
                othersMessage: 'Espere o jogo terminar antes de iniciar um novo.',
                stopButton: 'Parar',
                startMessage: 'Vamos jogar Tic Tac Toe!',
            });

            game.startGame();
        } catch (error) {
            console.error('Erro ao processar o comando:', error);
            message.reply('Houve um erro ao processar o comando.');
        }
    },
};
