const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js")
const Jimp = require("jimp")
const fetch = require('node-fetch'); // Para baixar avatares
module.exports = {
    data: new SlashCommandBuilder()
        .setName("ship")
        .setDescription("Faça um ship de duas pessoas!")
        .addUserOption(option => option
            .setName("usuario1")
            .setRequired(true)
            .setDescription("Quem será o primeiro shipado?")
        )
        .addUserOption(option => option
            .setName("usuario2")
            .setDescription("Quem será o segundo shipado?")
            .setRequired(true)
        ),
    async execute(interaction) {
        const usuario1 = interaction.options.getUser('usuario1');
        const usuario2 = interaction.options.getUser('usuario2');
    
        const porcentagem = Math.floor(Math.random() * 101);
        const metade1 = usuario1.username.slice(0, Math.floor(usuario1.username.length / 2));
        const metade2 = usuario2.username.slice(Math.floor(usuario2.username.length / 2));
        const nomeship = metade1 + metade2;
    
        const avatar1 = await Jimp.read(await (await fetch(usuario1.displayAvatarURL({ format: 'png' }))).buffer());
        avatar1.resize(250, 250);
    
        const avatar2 = await Jimp.read(await (await fetch(usuario2.displayAvatarURL({ format: 'png' }))).buffer());
        avatar2.resize(250, 250);
    
        const planodefundo = new Jimp(500, 280, '#383838'); // Cor de fundo
        planodefundo.composite(avatar1, 0, 0);
        planodefundo.composite(avatar2, 250, 0);
    
        const roundedRect = new Jimp(500 * (porcentagem / 100), 39, '#CF0D30');
        planodefundo.composite(roundedRect, 0, 250);
    
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        planodefundo.print(font, 230, 250, `${porcentagem}%`);
    
        const buffer = await planodefundo.getBufferAsync(Jimp.MIME_PNG);
    
        let mensagem_extra;
        if (porcentagem <= 35) {
          mensagem_extra = "😅 Não parece rolar uma química tão grande, mas quem sabe...?";
        } else if (porcentagem > 35 && porcentagem <= 65) {
          mensagem_extra = "☺️ Essa combinação tem potencial, que tal um jantar romântico?";
        } else {
          mensagem_extra = "😍 Combinação perfeita! Quando será o casamento?";
        }
    
        await interaction.reply({
          content: `**Será que vamos ter um casal novo por aqui?** \n ${usuario1} + ${usuario2} = ✨ \`${nomeship}\` ✨\n${mensagem_extra}`,
          files: [new Discord.AttachmentBuilder(buffer, 'file.png')],
        });

    },
};
