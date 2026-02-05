const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
    },
    pickaxe: {
        type: String,
        default: '', // Adicionar campo para armazenar o tipo de picareta
    },
    durability: {
        type: Number,
        default: 0, // Durabilidade inicial da picareta
    },
    minerals: {
        type: Map,
        of: Number,
        default: {}, // Mapa para armazenar minérios e quantidades
    },
    banned: {
        type: Boolean,
        default: false, // Campo de banimento adicionado
    },
    premium: {
        type: Boolean,
        default: false, // Campo premium adicionado
    },
    balance: {
        type: Number,  // Alterado para Number para armazenar valores numéricos
        default: 0,    // Alterado para 0, pois balance é um número
    },
    lastDaily: {
        type: Date,
        default: Date.now,
    },
    insignias: {
        type: [String],
        default: [],
    }
}, { collection: 'users',  });

const User = mongoose.model('User', userSchema);

module.exports = User;
