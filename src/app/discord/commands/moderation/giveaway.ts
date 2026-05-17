import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { createRow } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import {
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	type GuildMember,
	type Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from 'discord.js';
import {
	createConfirmationEmbed,
	createErrorEmbed,
	createSuccessEmbed,
} from '../utils.js';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL as string);

const TIME_UNITS: Record<string, number> = {
	month: 30 * 24 * 60 * 60 * 1000,
	mo: 30 * 24 * 60 * 60 * 1000,
	week: 7 * 24 * 60 * 60 * 1000,
	wk: 7 * 24 * 60 * 60 * 1000,
	day: 24 * 60 * 60 * 1000,
	d: 24 * 60 * 60 * 1000,
	hour: 60 * 60 * 1000,
	hr: 60 * 60 * 1000,
	h: 60 * 60 * 1000,
	minute: 60 * 1000,
	min: 60 * 1000,
	m: 60 * 1000,
	second: 1000,
	sec: 1000,
	s: 1000,
};

function parseDuration(input: string): number {
	const regex =
		/(\d+)\s*(month|mo|week|wk|day|d|hour|hr|h|minute|min|m|second|sec|s)/gi;
	let total = 0;
	let match: RegExpExecArray | null = regex.exec(input);
	while (match !== null) {
		const value = parseInt(match[1], 10);
		const unit = match[2].toLowerCase();
		total += value * (TIME_UNITS[unit] ?? 0);
		match = regex.exec(input);
	}
	return total;
}

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('giveaway')
		.setDescription('Start a giveaway in the server')
		.setDescriptionLocalizations({
			'pt-BR': 'Inicie um sorteio no servidor',
			'es-ES': 'Inicia un sorteo en el servidor',
		})
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addStringOption((opt) =>
			opt
				.setName('prize')
				.setNameLocalizations({
					'pt-BR': 'prêmio',
					'es-ES': 'premio',
				})
				.setDescription('What is the prize for the giveaway?')
				.setDescriptionLocalizations({
					'pt-BR': 'Qual é o prêmio do sorteio?',
					'es-ES': '¿Cuál es el premio del sorteo?',
				})
				.setRequired(true),
		)
		.addStringOption((opt) =>
			opt
				.setName('duration')
				.setNameLocalizations({
					'pt-BR': 'duração',
					'es-ES': 'duración',
				})
				.setDescription('Duration (e.g. 1d 2h 30m 15s)')
				.setDescriptionLocalizations({
					'pt-BR': 'Duração (ex: 1d 2h 30m 15s)',
					'es-ES': 'Duración (ej: 1d 2h 30m 15s)',
				})
				.setRequired(true),
		)
		.addIntegerOption((opt) =>
			opt
				.setName('winners')
				.setNameLocalizations({
					'pt-BR': 'vencedores',
					'es-ES': 'ganadores',
				})
				.setDescription('How many winners should be selected?')
				.setDescriptionLocalizations({
					'pt-BR': 'Quantos vencedores devem ser selecionados?',
					'es-ES': '¿Cuántos ganadores deben ser seleccionados?',
				})
				.setMinValue(1)
				.setMaxValue(10),
		),

	run: async ({ client, interaction, res }) => {
		const locale: Locale = interaction.locale;
		const t = replyLang;

		if (!interaction.guild) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'giveaway#responses#error_no_guild'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		const executor = interaction.member as GuildMember;
		const me =
			interaction.guild.members.cache.get(client.solid.user.id) ??
			(await interaction.guild.members.fetch(client.solid.user.id));

		if (!me.permissions.has(PermissionFlagsBits.ManageGuild)) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'giveaway#responses#error_bot_permission'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		if (
			!executor.permissions.has(PermissionFlagsBits.ManageGuild) &&
			interaction.guild.ownerId !== executor.id
		) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'giveaway#responses#error_user_permission'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		const prize = interaction.options.getString('prize', true);
		const durationStr = interaction.options.getString('duration', true);
		const winnersCount = interaction.options.getInteger('winners') ?? 1;

		const durationMs = parseDuration(durationStr);
		if (durationMs <= 0) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'giveaway#responses#error_invalid_duration'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		const endTime = Date.now() + durationMs;
		const giveawayId = `giveaway:${interaction.guild.id}:${Date.now()}`;

		await redis.hset(giveawayId, {
			prize,
			guildId: interaction.guild.id,
			channelId: interaction.channelId,
			messageId: '',
			endTime: endTime.toString(),
			winnersCount: winnersCount.toString(),
			hostId: interaction.user.id,
			participants: JSON.stringify([]),
			status: 'active',
		});

		await redis.expire(giveawayId, Math.ceil((durationMs + 600_000) / 1000));

		const embed = createConfirmationEmbed(locale, {
			title: '🎉 Giveaway',
			description: t(locale, 'giveaway#responses#giveaway_created', {
				prize,
				duration: durationStr,
				winners: winnersCount,
				endTime: `<t:${Math.floor(endTime / 1000)}:R>`,
			}),
			user: interaction.user,
		});

		const joinRow = createRow(
			new ButtonBuilder()
				.setCustomId(`giveaway_join_${giveawayId}`)
				.setLabel(t(locale, 'giveaway#responses#join_button'))
				.setStyle(ButtonStyle.Success)
				.setEmoji(emotes.utils.checkmark || '🎉'),
		);

		const manageRow = createRow(
			new ButtonBuilder()
				.setCustomId(`giveaway_manage_${giveawayId}`)
				.setLabel('Manage')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji('⚙️'),
		);

		res.raw({
			embeds: [embed],
			components: [joinRow, manageRow],
		});

		const message = await interaction.fetchReply();

		await redis.hset(giveawayId, 'messageId', message.id);
	},
});

export async function handleGiveawayJoinButton(
	interaction: ButtonInteraction,
	res: any,
) {
	const locale: Locale = interaction.locale;
	const t = replyLang;
	const customId = interaction.customId;

	if (!customId.startsWith('giveaway_join_')) return;

	const giveawayId = customId.replace('giveaway_join_', '');
	const giveawayData = await redis.hgetall(giveawayId);

	if (!giveawayData || Object.keys(giveawayData).length === 0) {
		const embed = createErrorEmbed(
			locale,
			'Error',
			t(locale, 'giveaway#responses#giveaway_not_found'),
		);
		return res.ephemeral().raw({ embeds: [embed] });
	}

	if (giveawayData.status !== 'active') {
		const embed = createErrorEmbed(
			locale,
			'Error',
			t(locale, 'giveaway#responses#giveaway_ended'),
		);
		return res.ephemeral().raw({ embeds: [embed] });
	}

	const endTime = parseInt(giveawayData.endTime, 10);
	if (Date.now() > endTime) {
		const embed = createErrorEmbed(
			locale,
			'Error',
			t(locale, 'giveaway#responses#giveaway_ended'),
		);
		return res.ephemeral().raw({ embeds: [embed] });
	}

	const participants = JSON.parse(giveawayData.participants || '[]');
	const userId = interaction.user.id;

	if (participants.includes(userId)) {
		const embed = createErrorEmbed(
			locale,
			'Error',
			t(locale, 'giveaway#responses#already_joined'),
		);
		return res.ephemeral().raw({ embeds: [embed] });
	}

	participants.push(userId);
	await redis.hset(giveawayId, 'participants', JSON.stringify(participants));

	const embed = createSuccessEmbed(
		t(locale, 'giveaway#responses#joined_title'),
		t(locale, 'giveaway#responses#joined_description', {
			prize: giveawayData.prize,
		}),
	);

	await res.ephemeral().raw({ embeds: [embed] });
}

export async function handleGiveawayManageButton(
	interaction: ButtonInteraction,
	res: any,
) {
	const locale: Locale = interaction.locale;
	const t = replyLang;
	const customId = interaction.customId;

	if (!customId.startsWith('giveaway_manage_')) return;

	const executor = interaction.member as GuildMember;
	if (
		!executor.permissions.has(PermissionFlagsBits.ManageGuild) &&
		interaction.guild?.ownerId !== executor.id
	) {
		const embed = createErrorEmbed(
			locale,
			'Error',
			t(locale, 'giveaway#responses#error_manage_permission'),
		);
		return res.ephemeral().raw({ embeds: [embed] });
	}

	const giveawayId = customId.replace('giveaway_manage_', '');
	const giveawayData = await redis.hgetall(giveawayId);

	if (!giveawayData || Object.keys(giveawayData).length === 0) {
		const embed = createErrorEmbed(
			locale,
			'Error',
			t(locale, 'giveaway#responses#giveaway_not_found'),
		);
		return res.ephemeral().raw({ embeds: [embed] });
	}

	const manageRow = createRow(
		new ButtonBuilder()
			.setCustomId(`giveaway_end_${giveawayId}`)
			.setLabel('End Now')
			.setStyle(ButtonStyle.Danger)
			.setEmoji('⏹️'),
		new ButtonBuilder()
			.setCustomId(`giveaway_reroll_${giveawayId}`)
			.setLabel('Reroll')
			.setStyle(ButtonStyle.Primary)
			.setEmoji('🔄'),
	);

	const embed = createConfirmationEmbed(locale, {
		title: '⚙️ Giveaway Management',
		description: t(locale, 'giveaway#responses#manage_panel', {
			prize: giveawayData.prize,
			participants: JSON.parse(giveawayData.participants || '[]').length,
		}),
		user: interaction.user,
	});

	await res.ephemeral().raw({
		embeds: [embed],
		components: [manageRow],
	});
}

export async function handleGiveawayEndButton(
	interaction: ButtonInteraction,
	res: any,
) {
	const locale: Locale = interaction.locale;
	const t = replyLang;
	const customId = interaction.customId;

	if (!customId.startsWith('giveaway_end_')) return;

	const executor = interaction.member as GuildMember;
	if (
		!executor.permissions.has(PermissionFlagsBits.ManageGuild) &&
		interaction.guild?.ownerId !== executor.id
	) {
		const embed = createErrorEmbed(
			locale,
			'Error',
			t(locale, 'giveaway#responses#error_manage_permission'),
		);
		return res.ephemeral().raw({ embeds: [embed] });
	}

	const giveawayId = customId.replace('giveaway_end_', '');
	const giveawayData = await redis.hgetall(giveawayId);

	if (!giveawayData) return;

	await processGiveawayEnd(
		giveawayId,
		giveawayData,
		interaction.client,
		locale,
	);
	await redis.del(giveawayId);

	const embed = createSuccessEmbed(
		'Giveaway Ended',
		'Giveaway has been ended manually by staff.',
	);
	await res.ephemeral().raw({ embeds: [embed] });
}

export async function handleGiveawayRerollButton(
	interaction: ButtonInteraction,
	res: any,
) {
	const locale: Locale = interaction.locale;
	const t = replyLang;
	const customId = interaction.customId;

	if (!customId.startsWith('giveaway_reroll_')) return;

	const executor = interaction.member as GuildMember;
	if (
		!executor.permissions.has(PermissionFlagsBits.ManageGuild) &&
		interaction.guild?.ownerId !== executor.id
	) {
		const embed = createErrorEmbed(
			locale,
			'Error',
			t(locale, 'giveaway#responses#error_manage_permission'),
		);
		return res.ephemeral().raw({ embeds: [embed] });
	}

	const giveawayId = customId.replace('giveaway_reroll_', '');
	const giveawayData = await redis.hgetall(giveawayId);

	if (!giveawayData) return;

	const participants = JSON.parse(giveawayData.participants || '[]');
	if (participants.length === 0) {
		const embed = createErrorEmbed(
			locale,
			'Error',
			'No participants to reroll.',
		);
		return res.ephemeral().raw({ embeds: [embed] });
	}

	const randomIndex = Math.floor(Math.random() * participants.length);
	const winner = participants[randomIndex];

	const channel = await interaction.channel?.fetch();
	if (channel && 'send' in channel) {
		const embed = createSuccessEmbed('🔄 Reroll', `New winner: <@${winner}>`);
		await (channel as any).send({ embeds: [embed] });
	}

	const embed = createSuccessEmbed(
		'Reroll Complete',
		`New winner: <@${winner}>`,
	);
	await res.ephemeral().raw({ embeds: [embed] });
}

export async function checkEndedGiveaways(client: any) {
	try {
		const now = Date.now();
		const keys = await redis.keys('giveaway:*');

		for (const key of keys) {
			const giveawayData = await redis.hgetall(key);

			if (!giveawayData || Object.keys(giveawayData).length === 0) {
				continue;
			}

			if (giveawayData.status !== 'active') continue;

			const endTime = parseInt(giveawayData.endTime, 10);
			if (now > endTime) {
				await processGiveawayEnd(key, giveawayData, client, 'en-US' as Locale);
				await redis.del(key);
			}
		}
	} catch (error) {
		console.error('Error in checkEndedGiveaways worker:', error);
	}
}

async function processGiveawayEnd(
	_giveawayId: string,
	giveawayData: any,
	client: any,
	locale: Locale,
) {
	try {
		const prize = giveawayData.prize;
		const winnersCount = parseInt(giveawayData.winnersCount, 10);
		const channelId = giveawayData.channelId;

		const participants = JSON.parse(giveawayData.participants || '[]');

		await redis.hset(_giveawayId, 'status', 'ended');

		if (participants.length === 0) {
			const channel = await client.channels.fetch(channelId);
			if (channel?.isTextBased()) {
				const embed = createErrorEmbed(
					locale,
					'Giveaway Ended',
					`No one participated in the giveaway for **${prize}**.`,
				);
				await channel.send({ embeds: [embed] });
			}
			return;
		}

		const winners: string[] = [];
		const participantsCopy = [...participants];

		for (let i = 0; i < Math.min(winnersCount, participantsCopy.length); i++) {
			const randomIndex = Math.floor(Math.random() * participantsCopy.length);
			winners.push(participantsCopy.splice(randomIndex, 1)[0]);
		}

		const channel = await client.channels.fetch(channelId);
		if (channel?.isTextBased()) {
			const embed = createSuccessEmbed(
				'🎉 Giveaway Ended',
				`Congratulations! The winner(s) of **${prize}** are:\n${winners.map((w) => `<@${w}>`).join('\n')}`,
			);

			try {
				await channel.send({ embeds: [embed] });
			} catch (error) {
				console.error('Failed to send giveaway end message:', error);
			}
		}
	} catch (error) {
		console.error('Error processing giveaway end:', error);
	}
}
