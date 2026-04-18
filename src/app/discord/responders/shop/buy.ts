import { getUserFullData } from '@app/discord/commands/economy/subcommands/utils.js';
import { UserController } from '@app/jobs/UserController.js';
import { createResponder, registerResponder } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import {
	brBuilder,
	createContainer,
	createRow,
	createThumbArea,
	Separator,
} from '@magicyan/discord';
import { emotes, images } from '@misc/emotes.js';
import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { getShopI } from '@misc/shop.js';

registerResponder(
	createResponder({
		customId: 'shop/roleplay/items',
		type: 'stringSelect',
		run: async ({ interaction, res }) => {
			const selected = interaction.values[0];
			const itemData = selected.replace('item/', '');
			const userId = interaction.user.id;

			const userAccount = await getUserFullData(userId);

			if (!userAccount) {
				return res.update().v2([
					createContainer(
						'#ed4245',
						replyLang(interaction.locale, 'shop#buy#error#no_account_title'),
						Separator.Default,
						replyLang(
							interaction.locale,
							'shop#buy#error#no_account_description',
							{
								command: '</create account:1419159279935688795>',
							},
						),
					),
				]);
			}

			const items = getShopI(interaction.locale);
			const item = items.find((i) => i.cid === itemData);

			if (!item) {
				return res
					.update()
					.v2([
						createContainer(
							'#ed4245',
							replyLang(
								interaction.locale,
								'shop#buy#error#item_not_found_title',
							),
							Separator.Default,
							replyLang(
								interaction.locale,
								'shop#buy#error#item_not_found_description',
							),
						),
					]);
			}

			if (userAccount.balance < item.price) {
				return res.update().v2([
					createContainer(
						'#ed4245',
						replyLang(
							interaction.locale,
							'shop#buy#error#insufficient_funds_title',
						),
						Separator.Default,
						replyLang(
							interaction.locale,
							'shop#buy#error#insufficient_funds_description',
							{
								item_name: item.name,
								item_price: item.price,
								current_balance: userAccount.balance,
								missing: item.price - userAccount.balance,
							},
						),
					),
				]);
			}

			return res.update().v2([
				createContainer(
					'#FF6B35',
					createThumbArea(
						brBuilder([
							replyLang(interaction.locale, 'shop#buy#confirmation#title'),
							replyLang(
								interaction.locale,
								'shop#buy#confirmation#description',
								{
									item_name: item.name,
									item_description: item.description,
									item_price: item.price,
									current_balance: userAccount.balance,
									new_balance: userAccount.balance - item.price,
								},
							),
						]),
						interaction.user.displayAvatarURL(),
					),
					Separator.Default,
					createRow(
						new ButtonBuilder()
							.setCustomId(`confirm/buy/${item.cid}`)
							.setLabel(
								replyLang(interaction.locale, 'shop#buy#buttons#confirm'),
							)
							.setStyle(ButtonStyle.Secondary)
							.setEmoji(emotes.utils.checkmark),
						new ButtonBuilder()
							.setCustomId('cancel/buy')
							.setLabel(
								replyLang(interaction.locale, 'shop#buy#buttons#cancel'),
							)
							.setStyle(ButtonStyle.Danger)
							.setEmoji(emotes.utils.crossmark),
					),
				),
			]);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'confirm/buy/{itemId}',
		type: 'button',
		run: async ({ interaction, useParams, res }) => {
			const { itemId } = useParams();
			const userId = interaction.user.id;

			const userAccount = await getUserFullData(userId);

			if (!userAccount) {
				return res.update().v2([
					createContainer(
						'#ed4245',
						replyLang(interaction.locale, 'shop#buy#error#no_account_title'),
						Separator.Default,
						replyLang(
							interaction.locale,
							'shop#buy#error#no_account_description',
							{
								command: '</create account:1419159279935688795>',
							},
						),
					),
				]);
			}

			const items = getShopI(interaction.locale);
			const item = items.find((i) => i.cid === itemId);

			if (!item || userAccount.balance < item.price) {
				return res
					.update()
					.v2([
						createContainer(
							'#ed4245',
							createThumbArea(
								brBuilder([
									replyLang(
										interaction.locale,
										'shop#buy#error#generic_error_title',
									),
									replyLang(
										interaction.locale,
										'shop#buy#error#generic_error_description',
									),
								]),
								images.koxik.cry,
							),
						),
					]);
			}

			await UserController.removeBalance(userId, item.price);

			await UserController.addItemToBackpack(userId, {
				name: item.name,
				id: item.cid,
				amount: 1,
				type: 'any',
			});

			return res.update().v2([
				createContainer(
					'#00bc7d',
					replyLang(interaction.locale, 'shop#buy#success#title'),
					replyLang(interaction.locale, 'shop#buy#success#description', {
						item_name: item.name,
						item_price: item.price,
						new_balance: userAccount.balance - item.price,
					}),
				),
			]);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'cancel/buy',
		type: 'button',
		run: async ({ interaction, res }) => {
			return res
				.update()
				.v2([
					createContainer(
						'#ed4245',
						createThumbArea(
							brBuilder([
								replyLang(interaction.locale, 'shop#buy#cancelled#title'),
								replyLang(interaction.locale, 'shop#buy#cancelled#description'),
							]),
							images.koxik.cry,
						),
					),
				]);
		},
	}),
);
