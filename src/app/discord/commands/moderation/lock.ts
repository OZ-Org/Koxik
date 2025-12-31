import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { EmbedPlusBuilder } from '@magicyan/discord';
import {
	Colors,
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

	run: async ({ interaction }) => {
		const locale: Locale = interaction.locale;
		const t = replyLang;

		if (!interaction.guild || !interaction.channel) return;

		const channel = interaction.channel as TextChannel;

		// Check if it's a text channel or similar that supports permission overwrites
		if (!('permissionOverwrites' in channel)) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'lock#responses#error'),
			);
			return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
		}

		try {
			await channel.permissionOverwrites.edit(interaction.guild.id, {
				SendMessages: false,
			});

			const embed = createSuccessEmbed(
				'Success',
				t(locale, 'lock#responses#success'),
			);

			await interaction.reply({
				embeds: [embed],
			});
		} catch (error) {
			console.error('Lock error:', error);
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'lock#responses#error'),
			);
			await interaction.reply({
				embeds: [embed],
				flags: ['Ephemeral'],
			});
		}
	},
});
