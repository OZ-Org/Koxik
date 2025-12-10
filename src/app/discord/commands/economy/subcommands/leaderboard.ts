import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { EmbedPlusBuilder } from '@magicyan/discord';
import { Colors } from 'discord.js';
import { createErrorEmbed, getLeaderboard } from './utils.js';

export const leaderboardSubCommand = createSubCommand({
	name: 'leaderboard',
	description: 'Check the richest users',
	name_localizations: {
		'pt-BR': 'ranking',
		'es-ES': 'ranking',
	},
	description_localizations: {
		'pt-BR': 'Veja os mais ricos',
		'es-ES': 'Ve los más ricos',
	},

	run: async ({ client, interaction }) => {
		await interaction.deferReply();

		try {
			const leaderboard = await getLeaderboard(10);

			if (leaderboard.length === 0) {
				const embed = createErrorEmbed(
					interaction.locale,
					replyLang(interaction.locale, 'eco#leaderboard#title'),
					replyLang(interaction.locale, 'eco#leaderboard#empty'),
				);

				await interaction.editReply({ embeds: [embed] });
				return;
			}

			const description = leaderboard
				.map((user, index) => {
					const medal =
						index === 0
							? '🥇'
							: index === 1
								? '🥈'
								: index === 2
									? '🥉'
									: `${index + 1}.`;

					return `${medal} <@${user.discord_id}> - \`${user.balance.toLocaleString()}\` polens`;
				})
				.join('\n');

			const embed = new EmbedPlusBuilder({
				author: {
					name: replyLang(interaction.locale, 'eco#leaderboard#title'),
					iconURL: client.user!.displayAvatarURL(),
				},
				color: Colors.Gold,
				description,
				thumbnail: {
					url: client.user!.displayAvatarURL({ size: 128 }),
				},
				timestamp: new Date(),
				footer: {
					text: replyLang(interaction.locale, 'eco#leaderboard#ranking'),
					iconURL: interaction.user.displayAvatarURL(),
				},
			});

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error('[leaderboard] Error:', error);

			const embed = createErrorEmbed(
				interaction.locale,
				replyLang(interaction.locale, 'eco#error#title'),
				replyLang(interaction.locale, 'eco#error#generic'),
			);

			await interaction.editReply({ embeds: [embed] });
		}
	},
});
