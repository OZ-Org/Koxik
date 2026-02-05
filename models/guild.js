const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    banned: {
        type: Boolean,
        default: false,
    },
    premium: {
        type: Boolean,
        default: false,
    },
    prefix: {
        type: String,
        default: 'k.',
    },
}, { collection: 'guilds' });

const Guild = mongoose.model('Guild', guildSchema);

module.exports = Guild;
