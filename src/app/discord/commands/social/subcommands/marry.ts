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

const MarrySubCommand = createSubCommand({
	name: 'marry',
	description: 'Marry someone',
	description_localizations: {
		'pt-BR': 'Case com alguém!',
		'es-ES': '¡Cásate con alguien!',
	},
	options: [
		{
			name: 'user',
			description: 'The user you want to marry',
			description_localizations: {
				'pt-BR': 'O usuário com quem você quer casar',
				'es-ES': 'El usuario con el que quieres casarte',
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
						replyLang(interaction.locale, 'marry#error#self'),
					),
				]);
		}

		const userData = await UserController.get(userId);
		const targetData = await UserController.get(targetId);

		if (userData.marriedWith) {
			return res
				.ephemeral()
				.v2([
					createContainer(
						'#ed4245',
						replyLang(interaction.locale, 'marry#error#already_married'),
					),
				]);
		}

		if (targetData.marriedWith) {
			return res
				.ephemeral()
				.v2([
					createContainer(
						'#ed4245',
						replyLang(interaction.locale, 'marry#error#target_married'),
					),
				]);
		}

		const marryCost = 15000;

		if (userData.balance < marryCost) {
			return res.ephemeral().v2([
				createContainer(
					'#ed4245',
					replyLang(interaction.locale, 'marry#error#insufficient_funds', {
						amount: marryCost,
					}),
				),
			]);
		}

		const message = await res.v2([
			createContainer(
				'#ff73fa',
				brBuilder([
					replyLang(interaction.locale, 'marry#confirmation#title'),
					replyLang(interaction.locale, 'marry#confirmation#description', {
						user: `<@${userId}>`,
						target: `<@${targetId}>`,
						cost: marryCost,
					}),
				]),
				Separator.Default,
				createRow(
					new ButtonBuilder()
						.setCustomId(`marry/accept/${userId}/${targetId}`)
						.setLabel(replyLang(interaction.locale, 'common#buttons#accept'))
						.setStyle(ButtonStyle.Secondary)
						.setEmoji(emotes.utils.checkmark),

					new ButtonBuilder()
						.setCustomId(`marry/decline/${userId}/${targetId}`)
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

			if (i.customId.startsWith('marry/accept')) {
				await UserController.update(userId, {
					marriedWith: targetId,
					balance: userData.balance - marryCost,
				});

				await UserController.update(targetId, {
					marriedWith: userId,
				});

				await res.update().v2([
					createContainer(
						'#00bc7d',
						brBuilder([
							replyLang(interaction.locale, 'marry#success#title'),
							replyLang(interaction.locale, 'marry#success#description', {
								user: `<@${userId}>`,
								target: `<@${targetId}>`,
								cost: marryCost,
							}),
						]),
					),
				]);
			}

			if (i.customId.startsWith('marry/decline')) {
				await res.update().v2([
					createContainer(
						'#ed4245',
						brBuilder([
							replyLang(interaction.locale, 'marry#declined#title'),
							replyLang(interaction.locale, 'marry#declined#description', {
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
						'⏰ Pedido expirou. O amor morreu na praia.',
					),
				]);
			}
		});
	},
});

export { MarrySubCommand };
