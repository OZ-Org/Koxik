require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { loadEvents } = require("@pedrozmz/easy-discord.js")

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution
    ]
});

module.exports = client;

loadEvents("Events", __dirname)
loadEvents("structure/util", __dirname)
loadEvents("structure/others", __dirname)
loadEvents("structure/database", __dirname)

client.login(process.env.DISCORD_TOKEN); 