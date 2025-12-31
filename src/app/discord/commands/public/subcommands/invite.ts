import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { createEmbed } from '@magicyan/discord';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Colors,
} from 'discord.js';

export default createSubCommand({
	name: 'invite',
	description: 'Get the invite link for Koxik!',
	description_localizations: {
		'pt-BR': 'Obtenha o link de convite da Koxik!',
		'es-ES': '¡Obtén el enlace de invitación de Koxik!',
	},
	run: async ({ interaction }) => {
		const invite =
			'https://discord.com/oauth2/authorize?client_id=1172215616227962624&permissions=8&redirect_uri=https%3A%2F%2Fkoxik.ozorg.xyz%2Fapi%2Fauth%2Fdiscord&response_type=code&scope=identify%20email%20guilds.members.read';

		const embed = createEmbed({
			title: replyLang(interaction.locale, 'invite#title'),
			description: replyLang(interaction.locale, 'invite#description'),
			color: Colors.Orange,
		});

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel(replyLang(interaction.locale, 'invite#button'))
				.setStyle(ButtonStyle.Link)
				.setURL(invite),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
			flags: ['Ephemeral'],
		});
	},
});
