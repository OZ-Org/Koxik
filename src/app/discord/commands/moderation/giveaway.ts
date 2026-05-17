import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { createRow } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import {
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
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
		.addIntegerOption((opt) =>
			opt
				.setName('duration')
				.setNameLocalizations({
					'pt-BR': 'duração',
					'es-ES': 'duración',
				})
				.setDescription('How long should the giveaway last? (in minutes)')
				.setDescriptionLocalizations({
					'pt-BR': 'Quanto tempo deve durar o sorteio? (em minutos)',
					'es-ES': '¿Cuánto tiempo debe durar el sorteo? (en minutos)',
				})
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(10080),
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
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(10),
		),

	run: async ({ interaction, res }) => {
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

		const prize = interaction.options.getString('prize', true);
		const durationMinutes = interaction.options.getInteger('duration', true);
		const winnersCount = interaction.options.getInteger('winners', true);

		const endTime = Date.now() + durationMinutes * 60 * 1000;
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
		});

		await redis.expire(giveawayId, (durationMinutes + 10) * 60);

		const embed = createConfirmationEmbed(locale, {
			title: 'Giveaway Created',
			description: t(locale, 'giveaway#responses#giveaway_created', {
				prize,
				duration: durationMinutes,
				winners: winnersCount,
				endTime: `<t:${Math.floor(endTime / 1000)}:R>`,
			}),
			user: interaction.user,
		});

		const row = createRow(
			new ButtonBuilder()
				.setCustomId(`giveaway_join_${giveawayId}`)
				.setLabel(t(locale, 'giveaway#responses#join_button'))
				.setStyle(ButtonStyle.Success)
				.setEmoji(emotes.utils.checkmark || '🎉'),
		);

		res.ephemeral().raw({
			embeds: [embed],
			components: [row],
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

export async function checkEndedGiveaways(client: any) {
	try {
		const now = Date.now();
		const keys = await redis.keys('giveaway:*');

		for (const key of keys) {
			const giveawayData = await redis.hgetall(key);

			if (!giveawayData || Object.keys(giveawayData).length === 0) {
				continue;
			}

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
				'Giveaway Ended',
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
