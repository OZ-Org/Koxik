import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { EmbedPlusBuilder } from '@magicyan/discord';
import {
	Colors,
	type Locale,
	type NewsChannel,
	PermissionFlagsBits,
	SlashCommandBuilder,
	type TextChannel,
	type ThreadChannel,
} from 'discord.js';
import { createErrorEmbed, createSuccessEmbed } from '../utils.js';

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clear messages from the channel.')
		.setDescriptionLocalizations({
			'pt-BR': 'Limpe mensagens do canal.',
			'es-ES': 'Limpia mensajes del canal.',
		})
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addIntegerOption((opt) =>
			opt
				.setName('amount')
				.setNameLocalizations({
					'pt-BR': 'quantidade',
					'es-ES': 'cantidad',
				})
				.setDescription('Number of messages to clear (1-100).')
				.setDescriptionLocalizations({
					'pt-BR': 'Número de mensagens para limpar (1-100).',
					'es-ES': 'Número de mensajes a limpiar (1-100).',
				})
				.setMinValue(1)
				.setMaxValue(100)
				.setRequired(true),
		),
	cooldown: 10,
	run: async ({ interaction }) => {
		const locale: Locale = interaction.locale;
		const t = replyLang;

		if (!interaction.guild || !interaction.channel) return;

		const amount = interaction.options.getInteger('amount', true);

		// Check if channel supports bulkDelete
		const channel = interaction.channel;
		if (!('bulkDelete' in channel)) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'clear#responses#error'),
			);
			return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
		}

		try {
			const deleted = await channel.bulkDelete(amount, true);

			const embed = createSuccessEmbed(
				'Success',
				t(locale, 'clear#responses#success', { count: deleted.size }),
			);

			await interaction.reply({
				embeds: [embed],
				flags: ['Ephemeral'],
			});
		} catch (error) {
			console.error('Clear error:', error);
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'clear#responses#error'),
			);
			await interaction.reply({
				embeds: [embed],
				flags: ['Ephemeral'],
			});
		}
	},
});
