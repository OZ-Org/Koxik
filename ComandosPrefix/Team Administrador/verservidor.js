const { EmbedBuilder, ChannelType } = require('discord.js');
const Guild = require('../../models/guild');

module.exports = {
  name: 'verservidor',
  description: '[Equipe do bot] Veja todas as informações de um servidor que o bot está conectado!',
  async execute(message, args) {
    try {
      if (!args[0]) {
        return message.reply('Por favor, forneça o ID do servidor.');
      }

      const guildId = args[0];
      const guild = message.client.guilds.cache.get(guildId);

      if (!guild) {
        return message.reply('O bot não está conectado a este servidor ou o ID fornecido está incorreto.');
      }


      if (!message.member.roles.cache.get("1265669129608626237")) {
        return;
      }

      const owner = await guild.fetchOwner();

      // Coletar informações das categorias
      const categories = guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildText)
        .map(category => category.name)
        .join(', ');

      // Coletar informações dos canais
      const channels = guild.channels.cache
        .filter(channel => channel.type !== ChannelType.GuildCategory)
        .map(channel => `${channel.name} (${channel.type})`)
        .join(', ');

      // Coletar informações dos cargos
      const roles = guild.roles.cache
        .filter(role => role.name !== '@everyone')
        .map(role => role.name)
        .join(', ');

      // Criar embed com as informações
      const embed = new EmbedBuilder()
        .setTitle(`Informações do servidor: ${guild.name}`)
        .setThumbnail(guild.iconURL())
        .setColor('#00FF00')
        .addFields(
          { name: 'ID do Servidor', value: guild.id, inline: true },
          { name: 'Nome do Servidor', value: guild.name, inline: true },
          { name: 'Dono do Servidor', value: `${owner.user.tag} (${owner.user.id})`, inline: true },
          { name: 'Categorias', value: categories || 'Nenhuma categoria', inline: false },
          { name: 'Canais', value: channels || 'Nenhum canal', inline: false },
          { name: 'Cargos', value: roles || 'Nenhum cargo', inline: false }
        )
   .setTimestamp();

      // Enviar embed para o canal
      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error("Erro ao processar o comando 'verservidor':", error);
      message.channel.send("Houve um erro ao processar o comando.");
    }
  }
};
