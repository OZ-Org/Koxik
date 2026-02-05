require('../index')

const Discord = require('discord.js')
const client = require('../index')
const Guild = require('../models/guild.js')
client.on("messageCreate", (message) => {
    if (message.author.bot) return;
  
    let mencoes = [`<@${client.user.id}>`, `<@!${client.user.id}>`]
  
    mencoes.forEach(element => {
      if (message.content === element) {
  
        const guild = Guild.findOne({ guildId: message.guild.id });
        const prefix = guild.prefix || 'k.'

        let embed = new Discord.EmbedBuilder()
        .setColor("#954535")
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynaimc: true }) })
        .setDescription(`😸 / Bom-Dia, Boa-Tarde ou Boa-Noite ${message.author}, use \`\`\`${prefix}ajuda\`\`\` ou use \`\`\`/ajuda\`\`\``)
        
        message.reply({ embeds: [embed] })
      }
    })
})