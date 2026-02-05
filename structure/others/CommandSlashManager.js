const client = require("../../index");
require('dotenv').config();
const { Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Guild = require("../../models/guild");
const User = require('../../models/user');
client.slashCommands = new Collection();

const commands = [];
const slashCommandsPath = path.join(__dirname, '../../ComandosSlash');

// Verifica e carrega os comandos
if (fs.existsSync(slashCommandsPath)) {
    const slashCommandFolders = fs.readdirSync(slashCommandsPath);
    for (const folder of slashCommandFolders) {
        const commandFiles = fs.readdirSync(path.join(slashCommandsPath, folder)).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(slashCommandsPath, folder, file));
            client.slashCommands.set(command.data.name, command);
            if (command.data && typeof command.data.toJSON === 'function') {
                commands.push(command.data.toJSON());
            } else {
                console.warn(`O comando em ${path.join(slashCommandsPath, folder, file)} não possui uma definição válida.`);
            }
        }
    }
}

client.on('ready', async () => {
    console.log(`${client.user.tag} está online!`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Registrando comandos globalmente...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('Comandos registrados com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar comandos: ', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    try {
        let guild = await Guild.findOne({ guildId: interaction.guild.id });
        if (guild && guild.banned) {
            await interaction.reply({ content: 'A guilda está banida do bot e você não pode usar este comando.', ephemeral: true });
            return;
        }

        let user = await User.findOne({ discordId: interaction.user.id });
        if (user && user.banned) {
            await interaction.reply({ content: 'Você está banido do bot e não pode usar este comando.', ephemeral: true });
            return;
        }

        const command = interaction.client.slashCommands.get(interaction.commandName);
        if (!command) {
            await interaction.reply({ content: 'Comando não encontrado.', ephemeral: true });
            return;
        }

        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Houve um erro ao executar este comando!', ephemeral: true });
        }
    }
});