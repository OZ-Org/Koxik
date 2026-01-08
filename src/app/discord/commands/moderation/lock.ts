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
		.setName('lock')
		.setDescription('Lock the current channel.')
		.setDescriptionLocalizations({
			'pt-BR': 'Tranque o canal atual.',
			'es-ES': 'Bloquea el canal actual.',
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
				t(locale, 'lock#responses#error'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		try {
			await channel.permissionOverwrites.edit(interaction.guild.id, {
				SendMessages: false,
			});

			const embed = createSuccessEmbed(
				'Success',
				t(locale, 'lock#responses#success'),
			);

			await res.raw({
				embeds: [embed],
			});
		} catch (error) {
			console.error('Lock error:', error);
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'lock#responses#error'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}
	},
});
