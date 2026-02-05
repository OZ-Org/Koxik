const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const jimp = require('jimp');

async function addTextToImage(image, text, maxWidth, fontSize) {
    let font = await jimp.loadFont(jimp[`FONT_SANS_${fontSize}_WHITE`]);
    const lines = [text]; // Coloca todo o texto em uma linha só

    return { lines, font };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stonks')
        .setDescription('Faça um sucesso com uma imagem personalizada')
        .addStringOption(option =>
            option.setName('texto')
                .setDescription('O que vai fazer sucesso')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const text = interaction.options.getString('texto');
            const image = await jimp.read('./imgs/stonks.jpg');

            const maxWidth = image.bitmap.width - 20;
            const fontSize = 32;

            const { lines, font } = await addTextToImage(image, text, maxWidth, fontSize);

            // Posiciona o texto na parte superior da imagem
            const x = (image.bitmap.width - jimp.measureText(font, lines[0])) / 2;
            const y = 10; // Margem superior de 10 pixels

            image.print(font, x, y, lines[0]);

            const buffer = await image.getBufferAsync(jimp.MIME_JPEG);
            const attachment = new AttachmentBuilder(buffer, 'stonks.jpg');

            await interaction.editReply({ content: `${interaction.user}`, files: [attachment] });
        } catch (error) {
            console.error('Erro ao processar a imagem:', error);
            await interaction.editReply('Houve um erro ao processar a imagem.');
        }
    },
};
