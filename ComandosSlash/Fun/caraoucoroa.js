const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('caraoucoroa')
        .setDescription('Jogue cara ou coroa!'),
    async execute(interaction) {
        const outcomes = ['Cara', 'Coroa', "No meio?!?"];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        if(outcome === "No meio?!?"){
            interaction.reply(`A moeda caiu em: ${outcome} QUE COMO ASSIM?!?`)
        } else return await interaction.reply(`A moeda caiu em: ${outcome}!`);
        
    },
};
