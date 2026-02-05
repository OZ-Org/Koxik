const Discord = require('discord.js');
const client = require('../../index.js');

const presences = [
    { name: "Designed by OpSistems", type: Discord.ActivityType.Custom },
    { name: "Meu prefixo padrão é k.", type: Discord.ActivityType.Custom }
];

let currentPresenceIndex = 0;

client.once('ready', () => {

    const setInitialPresence = () => {
        const initialPresence = presences[currentPresenceIndex];
        client.user.setPresence({
            activities: [{
                name: initialPresence.name,
                type: initialPresence.type
            }],
        });
    };

    setInitialPresence();

    setInterval(() => {
        currentPresenceIndex = (currentPresenceIndex + 1) % presences.length;
        const newPresence = presences[currentPresenceIndex];
        client.user.setPresence({
            activities: [{
                name: newPresence.name,
                type: newPresence.type
            }],
        });
    }, 5 * 60 * 1000);
});

