const User = require('../../models/user');

module.exports = {
    name: 'addinsg',
    description: 'Adiciona uma insígnia a um usuário',
    async execute(message, args) {
        try {

            if (!message.member.roles.cache.get("1265669129608626237")) return;


            if (args.length < 2) {
                return message.reply("Por favor, forneça um ID de usuário ou mencione o usuário, seguido da insígnia.");
            }
            
            const userId = args[0].replace(/[<@!>]/g, ''); // Remove menções
            const insignia = args.slice(1).join(' ');

            // Verificar se a insígnia é válida
            if (!['Developer', 'Reportador de Bugs', 'Youtuber', 'GigaChad', 'SemCaô', 'Millionaire'].includes(insignia)) {
                return message.reply("Insígnia inválida. As insígnias válidas são: Developer, Reportador de Bugs, Youtuber, GigaChad e SemCao.");
            }

            let user = await User.findOneAndUpdate(
                { discordId: userId },
                { $setOnInsert: { username: message.author.username, balance: '0', insignias: '' } },
                { new: true, upsert: true }
            );

            if (user.insignias) {
                let insigniaList = user.insignias.split(',').map(i => i.trim());
                if (!insigniaList.includes(insignia)) {
                    insigniaList.push(insignia);
                }
                user.insignias = insigniaList.join(', ');
            } else {
                user.insignias = insignia;
            }

            await user.save();

            message.reply(`A insígnia "${insignia}" foi adicionada ao usuário ${userId}.`);
        } catch (error) {
            console.error("Erro ao processar o comando 'addinsg':", error);
            message.channel.send("Houve um erro ao processar o comando.");
        }
    }
};
