import { UserController } from '@app/jobs/UserController.js';
import { createResponder, registerResponder } from '@base';
import { replyLang } from '@app/functions/utils/replyLang.js';
import type { BackpackItem } from '@app/shared/types.js';
import { getGifWithCustomId } from '@misc/gifs.js';

import {
	brBuilder,
	createContainer,
	createMediaGallery,
	createRow,
	Separator,
} from '@magicyan/discord';
import { ButtonBuilder, ButtonStyle } from 'discord.js';

registerResponder(
	createResponder({
		customId: 'marry/accept/{requesterId}/{targetId}',
		type: 'button',
		run: async ({ interaction, useParams, res }) => {
			const { requesterId, targetId } = useParams();
			const marryCost = 12000;

			const requesterData = await UserController.get(requesterId);
			const targetData = await UserController.get(targetId);

			if (!requesterData || !targetData) {
				return res
					.update()
					.v2([
						createContainer(
							'#ed4245',
							replyLang(interaction.locale, 'marry#error#generic'),
						),
					]);
			}

			if (
				!requesterData.datingWith ||
				requesterData.datingWith !== targetId ||
				!targetData.datingWith ||
				targetData.datingWith !== requesterId
			) {
				return res
					.update()
					.v2([
						createContainer(
							'#ed4245',
							replyLang(interaction.locale, 'marry#error#not_dating_anymore'),
						),
					]);
			}

			if (requesterData.balance < marryCost) {
				return res.update().v2([
					createContainer(
						'#ed4245',
						replyLang(
							interaction.locale,
							'marry#error#insufficient_funds_requester',
							{
								amount: marryCost,
							},
						),
					),
				]);
			}

			const backpack = (requesterData.backpack as BackpackItem[]) || [];
			const ringItem = backpack.find((item) => item.id === 'ringmarried');

			if (!ringItem) {
				return res
					.update()
					.v2([
						createContainer(
							'#ed4245',
							replyLang(interaction.locale, 'marry#error#no_ring'),
						),
					]);
			}

			await UserController.removeBalance(requesterId, marryCost);

			const newBackpack = backpack
				.map((item) => {
					if (item.id === 'ringmarried' && 'amount' in item) {
						return { ...item, amount: item.amount - 1 };
					}
					return item;
				})
				.filter((item) => !('amount' in item) || item.amount > 0);

			await UserController.update(requesterId, {
				marriedWith: targetId,
				datingWith: null,
				backpack: newBackpack,
			});

			await UserController.update(targetId, {
				marriedWith: requesterId,
				datingWith: null,
			});

			const { gif, customId } = getGifWithCustomId('marry');

			return res.update().v2([
				createContainer(
					'#00bc7d',
					brBuilder([
						replyLang(interaction.locale, 'marry#success#title'),
						replyLang(interaction.locale, 'marry#success#description', {
							user: `<@${requesterId}>`,
							target: `<@${targetId}>`,
							cost: marryCost,
						}),
					]),
					createMediaGallery([gif.url]),
					Separator.Default,
				),
				createRow([
					new ButtonBuilder({
						emoji: '🖼',
						label: replyLang(interaction.locale, 'common#buttons#source'),
						customId: customId,
						style: ButtonStyle.Secondary,
					}),
				]),
			]);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'marry/decline/{requesterId}/{targetId}',
		type: 'button',
		run: async ({ interaction, useParams, res }) => {
			const { requesterId, targetId } = useParams();

			return res.update().v2([
				createContainer(
					'#ed4245',
					brBuilder([
						replyLang(interaction.locale, 'marry#declined#title'),
						replyLang(interaction.locale, 'marry#declined#description', {
							requester: `<@${requesterId}>`,
							target: `<@${targetId}>`,
						}),
					]),
					Separator.Default,
				),
			]);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'marry/cancel/{requesterId}/{targetId}',
		type: 'button',
		run: async ({ interaction, useParams, res }) => {
			const { requesterId } = useParams();
			const targetId = interaction.user.id;

			if (interaction.user.id !== requesterId) {
				res.ephemeral().error(
					replyLang(interaction.locale, 'marry#error#not_host', {
						requester: `<@${requesterId}>`,
						target: `<@${targetId}>`,
					}),
				);
			}

			return res.update().v2([
				createContainer(
					'#ed4245',
					brBuilder([
						replyLang(interaction.locale, 'marry#cancelled#title'),
						replyLang(interaction.locale, 'marry#cancelled#description', {
							requester: `<@${requesterId}>`,
							target: `<@${targetId}>`,
						}),
					]),
					Separator.Default,
				),
			]);
		},
	}),
);
