import { replyLang } from '@fx/utils/replyLang.js';
import { SlashCommandBuilder } from 'discord.js';
import { createCommand } from 'index.js';

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('See current bot latency!')
		.setDescriptionLocalizations({
			'pt-BR': 'Veja latência atual do bot!',
			'es-ES': 'Mira la latencia actual del bot!',
		}),
	run: async ({ client, interaction }) => {
		const startTime = Date.now();

		await interaction.reply({
			flags: ['Ephemeral'],
			content: replyLang(interaction.locale, 'ping', {
				ping: `${client.ws.ping}ms`,
				ping_response: `${Date.now() - startTime}ms`,
			}),
		});
	},
});
