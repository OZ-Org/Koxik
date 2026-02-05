const User = require('../../models/user');

module.exports = {
    name: 'balance',
    description: 'Check your balance',
    aliases: ["dinheiro", "money"],
    execute: async (message, args) => {
        let user = await User.findOne({ discordId: message.author.id });
        if (!user) {
            user = new User({
                discordId: message.author.id,
                username: message.author.username,
                balance: 0
            });
            await user.save();
        }

        message.channel.send(`${message.author.username}, your balance is ${user.balance} coins.`);
    },
};
