const User = require('../../models/user');

module.exports = {
    name: 'work',
    description: 'Earn coins by working',
    execute: async (message, args) => {
        const earnings = Math.floor(Math.random() * 100) + 1;

        let user = await User.findOne({ discordId: message.author.id });
        if (!user) {
            user = new User({
                discordId: message.author.id,
                username: message.author.username,
                balance: earnings,
            });
        } else {
            user.balance += earnings;
        }

        await user.save();
        message.channel.send(`${message.author.username}, you worked hard and earned ${earnings} coins! Your new balance is ${user.balance} coins.`);
    },
};
