const { SlashCommandBuilder } = require('@discordjs/builders');
const jimp = require('jimp');

function sanitizeText(text) {
    return text.replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, '');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('faustao')
        .setDescription('Faça uma imagem com o Faustão')
        .addStringOption(option => option
            .setDescription('Texto para colocar na imagem do Faustão')
            .setName('texto')
            .setRequired(true)
        ),
    async execute(interaction) {
        const texto = sanitizeText(interaction.options.getString('texto'));
        const font = await jimp.loadFont(jimp.FONT_SANS_16_BLACK);
        await interaction.deferReply({ fetchReply: true });
        
        const img = await jimp.read('./imgs/faustao.jpg');

        const maxWidth = 400;
        const lines = [];
        let line = '';
        
        for (const word of texto.split(' ')) {
            const testLine = line + (line ? ' ' : '') + word;
            const { width } = jimp.measureText(font, testLine);
            
            if (width > maxWidth) {
                if (line) {
                    lines.push(line);
                }
                line = word;
            } else {
                line = testLine;
            }
        }
        if (line) {
            lines.push(line);
        }

        const x = 10;
        let y = 10;
        const lineHeight = 20;

        for (const line of lines) {
            img.print(font, x, y, line, maxWidth);
            y += lineHeight;
        }

        // Gera um buffer da imagem
        const buffer = await img.getBufferAsync(jimp.MIME_JPEG);

        // Envia o buffer como um arquivo anexado
        await interaction.editReply({
            content: 'Aqui está a sua imagem:',
            files: [{ attachment: buffer, name: 'faustao_output.jpg' }]
        });
    },
};
