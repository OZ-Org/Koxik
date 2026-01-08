import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { createContainer, Separator } from '@magicyan/discord';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default createSubCommand({
	name: 'invite',
	description: 'Get the invite link for Koxik!',
	description_localizations: {
		'pt-BR': 'Obtenha o link de convite da Koxik!',
		'es-ES': '¡Obtén el enlace de invitación de Koxik!',
	},
	run: async ({ interaction, res }) => {
		const invite =
			'https://discord.com/oauth2/authorize?client_id=1446227976793493594&permissions=6759076403735799&integration_type=0&scope=bot+applications.commands';

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel(replyLang(interaction.locale, 'invite#button'))
				.setStyle(ButtonStyle.Link)
				.setURL(invite),
		);

		const components = [
			createContainer(
				5763719,
				`## ${replyLang(interaction.locale, 'invite#title')}`,
				Separator.Default,
				`### ${replyLang(interaction.locale, 'invite#description')}`,
				row,
			),
		];

		return res.ephemeral().v2(components);
	},
});
