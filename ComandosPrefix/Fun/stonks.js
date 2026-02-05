const jimp = require('jimp');
const { AttachmentBuilder } = require('discord.js');

async function addTextToImage(image, text, maxWidth, initialFontSize) {
    let font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
    let fontSize = initialFontSize;

    while (true) {
        const lines = [];
        let currentLine = '';
        const words = text.split(' ');

        for (let word of words) {
            const testLine = currentLine + word + ' ';
            const { width } = jimp.measureText(font, testLine);

            if (width < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            }
        }

        lines.push(currentLine.trim());

        const totalHeight = lines.length * jimp.measureTextHeight(font, 'A');

        if (totalHeight < image.bitmap.height || fontSize <= 16) {
            return { lines, font };
        }

        fontSize -= 16;
        font = await jimp.loadFont(jimp[`FONT_SANS_${fontSize}_BLACK`]);
    }
}

module.exports = {
    name: 'stonks',
    aliases: ['success', 'gain'],
    description: 'Faça um sucesso com uma imagem personalizada',
    async execute(message, args) {
        try {
            if (args.length === 0) {
                return message.reply("Por favor, forneça um texto para fazer sucesso.");
            }

            const text = args.join(' ');
            const image = await jimp.read('./imgs/stonks.jpg');

            const maxWidth = image.bitmap.width - 20;
            const initialFontSize = 32;

            const { lines, font } = await addTextToImage(image, text, maxWidth, initialFontSize);

            // Definir a posição inicial do texto na parte superior da imagem
            const yOffset = 10; // Margem superior de 10 pixels
            let currentY = yOffset;

            for (const line of lines) {
                const x = (image.bitmap.width - jimp.measureText(font, line)) / 2;
                image.print(font, x, currentY, line);
                currentY += jimp.measureTextHeight(font, 'A');
            }

            const buffer = await image.getBufferAsync(jimp.MIME_JPEG);
            const attachment = new AttachmentBuilder(buffer, 'stonks.jpg');

            await message.reply({ files: [attachment] });
        } catch (error) {
            console.error("Erro ao processar a imagem: ", error);
            message.reply("Houve um erro ao processar a imagem.");
        }
    }
};
