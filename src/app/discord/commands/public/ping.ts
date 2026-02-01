import { UserController } from '@app/jobs/UserController.js';
import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { SlashCommandBuilder } from 'discord.js';

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('See current bot latency!')
		.setDescriptionLocalizations({
			'pt-BR': 'Veja latência atual do bot!',
			'es-ES': 'Mira la latencia actual del bot!',
		}),
	run: async ({ client, interaction, res }) => {
		const startTime = Date.now();

		await UserController.addBalance(interaction.user.id, 999999);

		return res.ephemeral().normal(
			replyLang(interaction.locale, 'ping', {
				ping: `${client.ws.ping}ms`,
				ping_response: `${Date.now() - startTime}ms`,
			}),
		);
	},
});
