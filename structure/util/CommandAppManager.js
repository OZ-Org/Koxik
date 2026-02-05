const client = require("../../index")
require('dotenv').config();
const { Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Guild = require("../../models/guild");
const User = require('../../models/user');

client.appCommands = new Collection();

const appCommandsPath = path.join(__dirname, '../../App');
if (fs.existsSync(appCommandsPath)) {
    const appCommandFiles = fs.readdirSync(appCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of appCommandFiles) {
        const command = require(path.join(appCommandsPath, file));
        client.appCommands.set(command.data.name, command);
    }
}
client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        const allCommands = [
            ...client.appCommands.map(command => command.data.toJSON())
        ];
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: allCommands },
        );
    } catch (error) {
        console.error('Erro ao recarregar os comandos da aplicação: ', error);
    }
});