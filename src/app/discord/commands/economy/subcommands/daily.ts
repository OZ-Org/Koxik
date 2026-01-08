import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { EmbedPlusBuilder, random } from '@magicyan/discord';
import { Colors, TimestampStyles, time } from 'discord.js';
import { claimDaily, createErrorEmbed } from './utils.js';

const DAILY_AMOUNT = random.int(500, 1500);

export const dailySubCommand = createSubCommand({
	name: 'daily',
	description: 'Claim your daily reward',
	name_localizations: {
		'pt-BR': 'daily',
		'es-ES': 'diario',
	},
	description_localizations: {
		'pt-BR': 'Pegue sua recompensa diária',
		'es-ES': 'Reclama tu recompensa diaria',
	},
	cooldown: 50,
	run: async ({ client, interaction }) => {
		await interaction.deferReply();

		try {
			const result = await claimDaily(
				interaction.user.id,
				DAILY_AMOUNT,
				interaction.locale,
			);

			const embed = new EmbedPlusBuilder({
				author: {
					name: replyLang(interaction.locale, 'eco#daily#success#title'),
					iconURL: client.user?.displayAvatarURL(),
				},
				color: Colors.Green,
				description: replyLang(
					interaction.locale,
					'eco#daily#success#description',
					{
						amount: DAILY_AMOUNT.toLocaleString(),
					},
				),
				fields: [
					{
						name: `💰 ${replyLang(interaction.locale, 'eco#daily#success#balance')}`,
						value: `\`${result.balance.toLocaleString()}\` pólens`,
						inline: true,
					},
					{
						name: `🔥 ${replyLang(interaction.locale, 'eco#daily#streak#title')}`,
						value: `${result.streakDays}`,
						inline: true,
					},
				],
				thumbnail: {
					url: interaction.user.displayAvatarURL({ size: 128 }),
				},
				timestamp: new Date(),
			});

			if (result.bonus > 0) {
				embed.addFields({
					name: `🎁 ${replyLang(interaction.locale, 'eco#daily#bonus#title')}`,
					value: replyLang(interaction.locale, 'eco#daily#bonus#description', {
						bonus: result.bonus.toLocaleString(),
						streak: result.streakDays,
					}),
					inline: false,
				});
			}

			await interaction.editReply({ embeds: [embed] });
		} catch (error: any) {
			if (error.cooldown) {
				const embed = createErrorEmbed(
					interaction.locale,
					replyLang(interaction.locale, 'eco#daily#cooldown#title'),
					replyLang(interaction.locale, 'eco#daily#cooldown#description'),
				);

				embed.addFields({
					name: replyLang(interaction.locale, 'eco#daily#nextClaim'),
					value: time(error.nextClaim, TimestampStyles.RelativeTime),
				});

				await interaction.editReply({ embeds: [embed] });
			} else {
				console.error('[daily] Error:', error);

				const embed = createErrorEmbed(
					interaction.locale,
					replyLang(interaction.locale, 'eco#daily#error#title'),
					error.message || replyLang(interaction.locale, 'eco#error#generic'),
				);

				await interaction.editReply({ embeds: [embed] });
			}
		}
	},
});
