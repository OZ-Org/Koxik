const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, { dbName: "koxik" }).then(() => {
    console.log('Conectado no MongoDB');
}).catch(err => {
    console.error('Erro ao tentar entrar no MongoDB! Erro: \n', err);
});