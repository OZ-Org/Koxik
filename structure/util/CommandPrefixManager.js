const client = require("../../index")
require('dotenv').config();
const { Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Guild = require("../../models/guild");
const User = require('../../models/user');
client.prefixCommands = new Collection();

const prefixCommandsPath = path.join(__dirname, '../../ComandosPrefix');
if (fs.existsSync(prefixCommandsPath)) {
    const prefixCommandFolders = fs.readdirSync(prefixCommandsPath);
    for (const folder of prefixCommandFolders) {
        const commandFiles = fs.readdirSync(path.join(prefixCommandsPath, folder)).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(prefixCommandsPath, folder, file));
            client.prefixCommands.set(command.name, command);

            if (command.aliases) {
                command.aliases.forEach(alias => {
                    client.prefixCommands.set(alias, command);
                });
            }
        }
    }
}


client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    let prefix = 'k.';

    try {
        const guild = await Guild.findOne({ guildId: message.guild.id });
        if (guild && guild.prefix) {
            prefix = guild.prefix;
        }
    } catch (error) {
        console.error('Erro ao buscar o prefixo da guilda:', error);
        return message.reply('Houve um erro ao verificar as configurações do servidor.');
    }

    if (!message.content.startsWith(prefix)) return;

    try {
        const guild = await Guild.findOne({ guildId: message.guild.id });
        if (guild && guild.banned) {
            await message.reply({ content: "A guilda está banida do bot e você não pode usar este comando." });
            return;
        }

        const user = await User.findOne({ discordId: message.author.id });
        if (user && user.banned) {
            await message.reply({ content: "Você está banido do bot e não pode usar este comando." });
            return;
        }
    } catch (error) {
        console.error('Erro ao verificar banimentos:', error);
        return message.reply('Houve um erro ao verificar as configurações do servidor.');
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error('Erro ao executar o comando:', error);
        message.reply('Houve um erro ao executar esse comando!');
    }
});