const Discord = require('discord.js');
const User = require('../../models/user');
const insigniaEmojis = {
    'Developer': '<:Developer:1255246883270561864>',
    'Youtuber': '<:YouTube:1255256246165045309>',
    'Reportador de Bugs': '<:ReportadorDeBugs:1255256107643834472>',
    'GigaChad': '<:gigachad:1255291627979804764>',
    'SemCaô': '<:semca:1256455920502968341>'
    // Adicione mais conforme necessário
};

module.exports = {
    name: 'vercadastro',
    description: 'Equipe administrativa',
    aliases: ['vercadas'],
    execute: async (message, args) => {
        const requiredRoleId = "1265669129608626237"; // ID do cargo necessário

        // Verifica se o membro tem o cargo necessário
        if (!message.member.roles.cache.has(requiredRoleId)) {
            return message.reply("Você não tem o cargo necessário para usar este comando.");
        }

        if (args.length < 1) {
            return message.reply("Uso incorreto do comando. A sintaxe correta é: `prefixovercadastro <usuário>`.");
        }

        const userId = args[0].replace(/[<@!>]/g, ''); // Remove caracteres de formatação

        // Busca o usuário no banco de dados
        let user = await User.findOne({ discordId: userId });
        if (!user) {
            return message.reply("Usuário não encontrado no banco de dados.");
        }

        let insigniasText = '';
        if (user && typeof user.insignias === 'string' && user.insignias.trim().length > 0) {
            const insigniaList = user.insignias.split(',').map(insignia => insignia.trim());
            insigniasText = insigniaList.map(insignia => `${insigniaEmojis[insignia]} ${insignia}`).join(', ');
        } else {
            insigniasText = 'Nenhuma insígnia ainda.';
        }

        const rep = "**SISTEMA __DESABILITADO__!**";
        let embed = new Discord.EmbedBuilder()
            .setTitle(`Cadastro do usuário ${user.username}!`)
            .setThumbnail(user.displayAvatarURL({ format: 'png' }))                        
            .setDescription(`\n> ID: ${user.discordId}\n\n> Insígnias:\n${insigniasText}\n> Reputação:\n${rep}`);
            
        return message.channel.send({ embeds: [embed] });
    },
};
