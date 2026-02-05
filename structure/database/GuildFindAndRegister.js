const Guild = require("../../models/guild");
const client = require('../../index');

const testVersion = true;

if (testVersion === false) {
    client.once('ready', async () => {
        try {
            const allGuilds = await Guild.find({});

            for (const guildRecord of allGuilds) {
                const guild = client.guilds.cache.get(guildRecord.guildId);

                if (!guild) {
                    await Guild.deleteOne({ guildId: guildRecord.guildId });
                } else {
                }
            }
        } catch (error) {
            console.error('Erro ao verificar guildas no banco de dados:', error);
        }
    });
} else {
return;
}

client.on('guildCreate', async (guild) => {
    try {
        let existingGuild = await Guild.findOne({ guildId: guild.id });

        if (!existingGuild) {
            const newGuild = new Guild({
                guildId: guild.id,
                name: guild.name,
                banned: false,
                premium: false
            });
            await newGuild.save();
        } else {
        }
    } catch (error) {
        console.error('Erro ao adicionar guilda ao banco de dados:', error);
    }
});

client.on('guildDelete', async (guild) => {
    try {
        let existingGuild = await Guild.findOne({ guildId: guild.id });

        if (existingGuild) {
            await Guild.deleteOne({ guildId: guild.id });
        } else {
        }
    } catch (error) {
        console.error('Erro ao remover guilda do banco de dados:', error);
    }
});
