import { UserController } from '@app/jobs/UserController.js';
import { createSubCommand } from '@base';
import { replyLang } from '@app/functions/utils/replyLang.js';
import {
	brBuilder,
	createContainer,
	Separator,
	createRow,
} from '@magicyan/discord';
import {
	ButtonBuilder,
	ButtonStyle,
	ApplicationCommandOptionType,
} from 'discord.js';
import { emotes } from '@misc/emotes.js';

const DateSubCommand = createSubCommand({
	name: 'date',
	description: 'Start dating someone',
	description_localizations: {
		'pt-BR': 'Comece a namorar alguém!',
		'es-ES': '¡Comienza a salir con alguien!',
	},
	options: [
		{
			name: 'user',
			description: 'The user you want to date',
			description_localizations: {
				'pt-BR': 'O usuário que você quer namorar',
				'es-ES': 'El usuario con el que quieres salir',
			},
			type: ApplicationCommandOptionType.User,
			required: true,
		},
	],
	run: async ({ interaction, res }) => {
		const targetUser = interaction.options.getUser('user', true);
		const userId = interaction.user.id;
		const targetId = targetUser.id;

		if (targetId === userId) {
			return res
				.ephemeral()
				.v2([
					createContainer(
						'#ed4245',
						replyLang(interaction.locale, 'date#error#self'),
					),
				]);
		}

		const userData = await UserController.get(userId);
		const targetData = await UserController.get(targetId);

		if (userData.datingWith) {
			return res
				.ephemeral()
				.v2([
					createContainer(
						'#ed4245',
						replyLang(interaction.locale, 'date#error#already_dating'),
					),
				]);
		}

		if (targetData.datingWith) {
			return res
				.ephemeral()
				.v2([
					createContainer(
						'#ed4245',
						replyLang(interaction.locale, 'date#error#target_dating'),
					),
				]);
		}

		if (userData.marriedWith) {
			return res
				.ephemeral()
				.v2([
					createContainer(
						'#ed4245',
						replyLang(interaction.locale, 'date#error#already_married'),
					),
				]);
		}

		if (targetData.marriedWith) {
			return res
				.ephemeral()
				.v2([
					createContainer(
						'#ed4245',
						replyLang(interaction.locale, 'date#error#target_married'),
					),
				]);
		}

		const dateCost = 5000;
		if (userData.balance < dateCost) {
			return res.ephemeral().v2([
				createContainer(
					'#ed4245',
					replyLang(interaction.locale, 'date#error#insufficient_funds', {
						amount: dateCost,
					}),
				),
			]);
		}

		const message = await res.v2([
			createContainer(
				'#FF6B35',
				brBuilder([
					replyLang(interaction.locale, 'date#confirmation#title'),
					replyLang(interaction.locale, 'date#confirmation#description', {
						user: `<@${userId}>`,
						target: `<@${targetId}>`,
						cost: dateCost,
					}),
				]),
				Separator.Default,
				createRow(
					new ButtonBuilder()
						.setCustomId(`date/accept/${userId}/${targetId}`)
						.setLabel(replyLang(interaction.locale, 'common#buttons#accept'))
						.setStyle(ButtonStyle.Secondary)
						.setEmoji(emotes.utils.checkmark),

					new ButtonBuilder()
						.setCustomId(`date/decline/${userId}/${targetId}`)
						.setLabel(replyLang(interaction.locale, 'common#buttons#decline'))
						.setStyle(ButtonStyle.Danger)
						.setEmoji(emotes.utils.crossmark),
				),
			),
		]);

		const collector = message.createMessageComponentCollector({
			time: 12 * 60 * 1000,
		});

		collector.on('collect', async (i) => {
			if (i.user.id !== targetId) {
				return i.reply({
					content: 'Isso não é pra você.',
					flags: ['Ephemeral'],
				});
			}

			collector.stop();

			if (i.customId.startsWith('date/accept')) {
				await UserController.update(userId, {
					datingWith: targetId,
				});

				await UserController.update(targetId, {
					datingWith: userId,
				});

				await i.update({
					components: [],
					content: null,
					embeds: [],
					...res.v2([
						createContainer(
							'#00bc7d',
							brBuilder([
								replyLang(interaction.locale, 'date#success#title'),
								replyLang(interaction.locale, 'date#success#description', {
									user: `<@${userId}>`,
									target: `<@${targetId}>`,
									cost: dateCost,
								}),
							]),
						),
					]),
				});
			}

			if (i.customId.startsWith('date/decline')) {
				await res.update().v2([
					createContainer(
						'#ed4245',
						brBuilder([
							replyLang(interaction.locale, 'date#declined#title'),
							replyLang(interaction.locale, 'date#declined#description', {
								requester: `<@${userId}>`,
								target: `<@${targetId}>`,
							}),
						]),
					),
				]);
			}
		});

		collector.on('end', async (_, reason) => {
			if (reason === 'time') {
				await res.v2FollowUp([
					createContainer(
						'#ed4245',
						'⏰ Pedido expirou. Ninguém teve coragem.',
					),
				]);
			}
		});
	},
});

export { DateSubCommand };
