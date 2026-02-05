const User = require('../../models/user.js');
const jimp = require('jimp');
const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js'); // Atualizado
const { client } = require('../../index.js');
const ms = require('ms')
const Discord = require('discord.js')
module.exports = {
    name: 'ajuda',
    description: 'Obtenha ajuda com o bot',
    aliases: ["help"],
    execute: async (message, args) => {
        try {

            let embed1 = new EmbedBuilder()
                .setColor('#000000')
                .setTitle(`Ajuda do Koxik`)
                .setImage('https://i.ibb.co/BfzB9g5/AJUDA.png')
                .setDescription(`Olá ${message.author}! Para receber ajuda clique na categoria abaixo e depois veja a lista de como usar`);
            let button1 = new ButtonBuilder()
                .setCustomId('123_opsistemslinda')
                .setEmoji('📚')
                .setLabel('Comandos Slash')
                .setStyle(ButtonStyle.Primary);
            let button2 = new ButtonBuilder()
                .setCustomId('456_opsistemslinda')
                .setEmoji('📚')
                .setLabel('Comandos Prefix')
                .setStyle(ButtonStyle.Primary);
            let row1 = new ActionRowBuilder()
                .addComponents(button1, button2);
            await message.reply({ embeds: [embed1], components: [row1]}).then((msg) => {

                let tempo = ms('5m')
                // Criar um coletor de mensagens para aguardar respostas
                let filter = (interaction) => {
                    return interaction.user.id === message.author.id;
                };

                let collector = message.channel.createMessageComponentCollector({
                    filter,
                    time: tempo, // Tempo limite de 5 minutos
                });

                // Lidar com interações de botão
                collector.on('collect', async (interaction) => {
                    if (interaction.customId === '123_opsistemslinda') {
                        let seubutao = new ButtonBuilder()
                            .setCustomId('seupaivoltou_121982')
                            .setEmoji('⬅️')
                            .setLabel('Voltar')
                            .setStyle(ButtonStyle.Primary);
                        let suamaeaquelagostosa = new ActionRowBuilder()
                            .addComponents(seubutao);
                        let embedSlash = new EmbedBuilder()
                            .setColor('#000000')
                            .setImage('https://i.ibb.co/BfzB9g5/AJUDA.png')
                            .setTitle('Comandos Slash')
                            .setDescription('/` /balance /` Veja o seu dinheiro no bot\n/`/`/` /top3 /`/`/` Veja as 3 pessoas com mais dinheiro no bot\n/`/`/` /work /`/`/` Trabalhe para conseguir dinheiro no bot\n/`/`/` /stonks /`/`/` Faça o meme Stonks');
                        await interaction.update({ embeds: [embedSlash], components: [suamaeaquelagostosa]});
                    } else if (interaction.customId === '456_opsistemslinda') {
                        // Implementar lógica para comandos Prefix
                        await interaction.update({ content: "prefixo", embeds: [], components: [] });
                    } else if(interaction.customId === "seupaivoltou_121982") {
                        await interaction.update({ embeds: [embed1], components: [row1]});
                    }
                });

                // Evento quando o coletor de mensagens terminar
                collector.on('end', (collected, reason) => {
                    console.log(`Coletor de mensagens encerrado. Foram coletadas ${collected.size} mensagens. Motivo: ${reason}`);
                });
            });
        } catch (error) {
            console.error("Erro ao processar o comando, imagem ou buscar usuários: ", error);
            message.channel.send("Houve um erro ao processar o comando.");
        }
    }
};
