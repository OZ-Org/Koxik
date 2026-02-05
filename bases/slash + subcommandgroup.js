const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('teste')
        .setDescription('Comando de teste com subcomandos')
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('grupo1')
                .setDescription('Este é o primeiro grupo de subcomandos')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('comando1')
                        .setDescription('Descrição do comando 1 do grupo 1')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('comando2')
                        .setDescription('Descrição do comando 2 do grupo 1')
                )
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('grupo2')
                .setDescription('Este é o segundo grupo de subcomandos')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('comando3')
                        .setDescription('Descrição do comando 3 do grupo 2')
                )
        ),
    async execute(interaction) {
        // Verifica qual subcomando foi usado
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'comando1') {
            await interaction.reply('Você usou o comando 1 do primeiro grupo!');
        } else if (subcommand === 'comando2') {
            await interaction.reply('Você usou o comando 2 do primeiro grupo!');
        } else if (subcommand === 'comando3') {
            await interaction.reply('Você usou o comando 3 do segundo grupo!');
        } else {
            await interaction.reply('Comando não reconhecido.');
        }
    },
};
