import { SlashCommandBuilder } from 'discord.js';
import { replyLang } from '@fx/utils/replyLang.js';
import { createCommand } from '@base';

export default createCommand({
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8ball a question!')
    .setDescriptionLocalizations({
      'pt-BR': 'Pergunte algo à bola mágica 8ball!',
      'es-ES': '¡Pregúntale algo a la bola mágica 8ball!',
    })
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Your question for the 8ball')
        .setDescriptionLocalizations({
          'pt-BR': 'Sua pergunta para a bola 8ball',
          'es-ES': 'Tu pregunta para la bola 8ball',
        })
        .setRequired(true),
    ),
  run: async (client, interaction) => {
    const question = interaction.options.getString('question', true);

    const responsesText = replyLang(interaction.locale, '8ball#responses');

    const responses = responsesText.split('\n');

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    await interaction.reply({
      content: `🎱 **${question}**\n\n${randomResponse}`,
    });
  },
});
