import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { EmbedPlusBuilder } from '@magicyan/discord';
import { Colors, SlashCommandBuilder } from 'discord.js';

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
				.setNameLocalizations({
					'pt-BR': 'pergunta',
					'es-ES': 'pregunta',
				})
				.setRequired(true),
		),
	run: async ({ interaction }) => {
		const question = interaction.options.getString('question', true);

		const responsesText = replyLang(interaction.locale, '8ball#responses');
		const responses = responsesText.split('\n');
		const randomResponse =
			responses[Math.floor(Math.random() * responses.length)];

		const embed = new EmbedPlusBuilder({
			color: Colors.Purple,
			title: `🎱 ${replyLang(interaction.locale, '8ball#title')}`,
			description: `> ${replyLang(interaction.locale, '8ball#question')}: \`\`\` ${question} \`\`\` \n\n> ${replyLang(interaction.locale, '8ball#answer')}: \`\`\` ${randomResponse} \`\`\` `,
			timestamp: Date.now(),
			footer: {
				text: interaction.user.displayName,
				iconURL: interaction.user.displayAvatarURL(),
			},
		});

		await interaction.reply({
			embeds: [embed],
			content: `${interaction.user}`,
		});
	},
});
