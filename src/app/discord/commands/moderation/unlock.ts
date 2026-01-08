import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import {
	type Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	type TextChannel,
} from 'discord.js';
import { createErrorEmbed, createSuccessEmbed } from '../utils.js';

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('unlock')
		.setDescription('Unlock the current channel.')
		.setDescriptionLocalizations({
			'pt-BR': 'Destranque o canal atual.',
			'es-ES': 'Desbloquea el canal actual.',
		})
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	run: async ({ interaction, res }) => {
		const locale: Locale = interaction.locale;
		const t = replyLang;

		if (!interaction.guild || !interaction.channel) return;

		const channel = interaction.channel as TextChannel;

		if (!('permissionOverwrites' in channel)) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'unlock#responses#error'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		try {
			await channel.permissionOverwrites.edit(interaction.guild.id, {
				SendMessages: true,
			});

			const embed = createSuccessEmbed(
				'Success',
				t(locale, 'unlock#responses#success'),
			);

			await res.raw({
				embeds: [embed],
			});
		} catch (error) {
			console.error('Unlock error:', error);
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'unlock#responses#error'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}
	},
});
