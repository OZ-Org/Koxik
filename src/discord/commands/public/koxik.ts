import { prisma } from 'base/db/prisma.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import { replyLang } from 'functions/utils/replyLang.js';
import { createCommand } from 'index.js';

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('koxik')
		.setDescription('Subcommand to view Koxik information.')
		.setDescriptionLocalizations({
			'pt-BR': 'Sub-Comando para ver informações do Koxik.',
			'es-ES': 'Subcomando para ver información de Koxik.',
		})
		.addSubcommand((subcommand) =>
			subcommand
				.setName('analytics')
				.setDescription('See detailed usage statistics for Koxik.')
				.setDescriptionLocalizations({
					'pt-BR': 'Confira as estatísticas detalhadas de uso do Koxik!',
					'es-ES': 'Consulta las estadísticas detalladas de uso de Koxik.',
				}),
		),

	run: async (client, interaction) => {
		let subcommand = interaction.options.getSubcommand(false) ?? null;
		if (subcommand === '__name__') subcommand = null;
		if (subcommand === null) return;

		if (subcommand === 'analytics') {
			try {
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				yesterday.setHours(0, 0, 0, 0);

				const startOfYear = new Date(new Date().getFullYear(), 0, 1);

				const topToday = await prisma.commandStat.findMany({
					where: { date: today },
					orderBy: { count: 'desc' },
					take: 1,
				});

				const topYesterday = await prisma.commandStat.findMany({
					where: { date: yesterday },
					orderBy: { count: 'desc' },
					take: 1,
				});

				const topYear = await prisma.commandStat.groupBy({
					by: ['command', 'subcommand'],
					_sum: { count: true },
					where: { date: { gte: startOfYear } },
					orderBy: { _sum: { count: 'desc' } },
					take: 1,
				});

				const totalToday = await prisma.commandStat.aggregate({
					_sum: { count: true },
					where: { date: today },
				});

				const totalYesterday = await prisma.commandStat.aggregate({
					_sum: { count: true },
					where: { date: yesterday },
				});

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
								'🔥 ' +
								replyLang(interaction.locale, 'botStats#mostUsed#today'),
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
							value: `${formatCommand(topYear[0])} • **${topYear[0]?._sum.count ?? 0}**`,
							inline: false,
						},
						{
							name:
								'📈 ' + replyLang(interaction.locale, 'botStats#total#today'),
							value: `**${totalToday._sum.count ?? 0}**`,
							inline: true,
						},
						{
							name:
								'📉 ' +
								replyLang(interaction.locale, 'botStats#total#yesterday'),
							value: `**${totalYesterday._sum.count ?? 0}**`,
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

				await interaction.reply({
					embeds: [embed],
					components: [row],
					flags: ['Ephemeral'],
				});
			} catch (err) {
				console.error('Erro ao buscar stats:', err);
				await interaction.reply({
					content: replyLang(interaction.locale, 'botStats#errorFetching'),
					flags: ['Ephemeral'],
				});
			}
		}
	},
});
