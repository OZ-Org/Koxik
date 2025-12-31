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
		.setName('unlock')
		.setDescription('Unlock the current channel.')
		.setDescriptionLocalizations({
			'pt-BR': 'Destranque o canal atual.',
			'es-ES': 'Desbloquea el canal actual.',
		})
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	run: async ({ interaction }) => {
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
			return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
		}

		try {
			await channel.permissionOverwrites.edit(interaction.guild.id, {
				SendMessages: true,
			});

			const embed = createSuccessEmbed(
				'Success',
				t(locale, 'unlock#responses#success'),
			);

			await interaction.reply({
				embeds: [embed],
			});
		} catch (error) {
			console.error('Unlock error:', error);
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'unlock#responses#error'),
			);
			await interaction.reply({
				embeds: [embed],
				flags: ['Ephemeral'],
			});
		}
	},
});
