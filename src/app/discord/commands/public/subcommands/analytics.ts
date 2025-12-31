import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { db } from 'core/base/db/db.js';
import { commandStat } from 'core/base/db/schemas.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} from 'discord.js';
import { desc, eq, gte, sum } from 'drizzle-orm';

export default createSubCommand({
	name: 'analytics',
	description: 'See detailed usage statistics for Koxik.',
	description_localizations: {
		'pt-BR': 'Confira as estatísticas detalhadas de uso do Koxik!',
		'es-ES': 'Consulta las estadísticas detalladas de uso de Koxik.',
	},
	cooldown: 10,
	run: async ({ interaction, client }) => {
		await interaction.deferReply({ flags: ['Ephemeral'] });
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(0, 0, 0, 0);

			const startOfYear = new Date(new Date().getFullYear(), 0, 1);
			startOfYear.setHours(0, 0, 0, 0);

			const topToday = await db.query.commandStat.findMany({
				where: eq(commandStat.date, today.toISOString()),
				orderBy: [desc(commandStat.count)],
				limit: 1,
			});

			const topYesterday = await db.query.commandStat.findMany({
				where: eq(commandStat.date, yesterday.toISOString()),
				orderBy: [desc(commandStat.count)],
				limit: 1,
			});

			const topYear = await db
				.select({
					command: commandStat.command,
					subcommand: commandStat.subcommand,
					count: sum(commandStat.count).mapWith(Number),
				})
				.from(commandStat)
				.where(gte(commandStat.date, startOfYear.toISOString()))
				.groupBy(commandStat.command, commandStat.subcommand)
				.orderBy(desc(sum(commandStat.count)))
				.limit(1);

			const totalToday = await db
				.select({ count: sum(commandStat.count).mapWith(Number) })
				.from(commandStat)
				.where(eq(commandStat.date, today.toISOString()));

			const totalYesterday = await db
				.select({ count: sum(commandStat.count).mapWith(Number) })
				.from(commandStat)
				.where(eq(commandStat.date, yesterday.toISOString()));

			const formatCommand = (entry: any) => {
				if (!entry) return replyLang(interaction.locale, 'botStats#none');
				const name =
					entry.subcommand && entry.subcommand !== '__name__'
						? `${entry.command} ${entry.subcommand}`
						: entry.command;
				return `\`${name}\``;
			};

			const embed = new EmbedBuilder()
				.setAuthor({
					name: '📊 Koxik Analytics',
					iconURL: client!.user!.displayAvatarURL(),
				})
				.setDescription(
					interaction.locale === 'pt-BR'
						? 'Um panorama das interações mais recentes com o bot!'
						: interaction.locale === 'es-ES'
							? '¡Un panorama de las interacciones más recientes con el bot!'
							: 'An overview of the most recent interactions with the bot!',
				)
				.setColor(0x2f3136)
				.addFields([
					{
						name:
							'🔥 ' + replyLang(interaction.locale, 'botStats#mostUsed#today'),
						value: `${formatCommand(topToday[0])} • **${topToday[0]?.count ?? 0}**`,
						inline: true,
					},
					{
						name:
							'📅 ' +
							replyLang(interaction.locale, 'botStats#mostUsed#yesterday'),
						value: `${formatCommand(topYesterday[0])} • **${topYesterday[0]?.count ?? 0}**`,
						inline: true,
					},
					{
						name:
							'🏆 ' + replyLang(interaction.locale, 'botStats#mostUsed#year'),
						value: `${formatCommand(topYear[0])} • **${topYear[0]?.count ?? 0}**`,
						inline: false,
					},
					{
						name: '📈 ' + replyLang(interaction.locale, 'botStats#total#today'),
						value: `**${totalToday[0]?.count ?? 0}**`,
						inline: true,
					},
					{
						name:
							'📉 ' + replyLang(interaction.locale, 'botStats#total#yesterday'),
						value: `**${totalYesterday[0]?.count ?? 0}**`,
						inline: true,
					},
				])
				.setTimestamp();

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel(
						interaction.locale === 'pt-BR'
							? '📊 Estatísticas'
							: interaction.locale === 'es-ES'
								? '📊 Estadísticas'
								: '📊 Statistics',
					)
					.setStyle(ButtonStyle.Primary)
					.setCustomId('disable/deco/statics')
					.setDisabled(true),
				new ButtonBuilder()
					.setLabel('🌐 Website')
					.setStyle(ButtonStyle.Link)
					.setURL('https://koxik.ozorg.com'),
			);

			await interaction.editReply({
				embeds: [embed],
				components: [row],
			});
		} catch (err) {
			console.error('Erro ao buscar stats:', err);
			await interaction.editReply({
				content: replyLang(interaction.locale, 'botStats#errorFetching'),
			});
		}
	},
});
