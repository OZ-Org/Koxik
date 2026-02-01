import { getUserFullData } from '@app/discord/commands/economy/subcommands/utils.js';
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
				const errorContainer = createContainer(
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
				);

				return res.update().v2([errorContainer]);
			}

			// Definições dos itens
			const shopItems = {
				ringmarried: {
					name: replyLang(interaction.locale, 'shop#select#ring_to_married'),
					description: replyLang(
						interaction.locale,
						'shop#select#ring_description',
					),
					price: 6000,
					emoji: '💍',
				},
			};

			const item = shopItems[itemData as keyof typeof shopItems];

			if (!item) {
				const errorContainer = createContainer(
					'#ed4245',
					replyLang(interaction.locale, 'shop#buy#error#item_not_found_title'),
					Separator.Default,
					replyLang(
						interaction.locale,
						'shop#buy#error#item_not_found_description',
					),
				);

				return res.update().v2([errorContainer]);
			}

			// Verificar se o usuário tem saldo suficiente
			if (userAccount.balance < item.price) {
				const errorContainer = createContainer(
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
				);

				return res.update().v2([errorContainer]);
			}

			const confirmContainer = createContainer(
				'#FF6B35',
				createThumbArea(
					brBuilder([
						replyLang(interaction.locale, 'shop#buy#confirmation#title'),
						replyLang(interaction.locale, 'shop#buy#confirmation#description', {
							item_name: item.name,
							item_description: item.description,
							item_price: item.price,
							current_balance: userAccount.balance,
							new_balance: userAccount.balance - item.price,
						}),
					]),
					interaction.user.displayAvatarURL(),
				),
				Separator.Default,
				createRow(
					new ButtonBuilder()
						.setCustomId(`confirm/buy/${itemData}`)
						.setLabel(replyLang(interaction.locale, 'shop#buy#buttons#confirm'))
						.setStyle(ButtonStyle.Secondary)
						.setEmoji(emotes.utils.checkmark),
					new ButtonBuilder()
						.setCustomId('cancel/buy')
						.setLabel(replyLang(interaction.locale, 'shop#buy#buttons#cancel'))
						.setStyle(ButtonStyle.Danger)
						.setEmoji(emotes.utils.crossmark),
				),
			);

			return res.update().v2([confirmContainer]);
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
				const errorContainer = createContainer(
					'#ed4245',
					`${emotes.utils.crossmark} | ${replyLang(interaction.locale, 'shop#buy#error#no_account_title')}`,
					Separator.Default,
					replyLang(
						interaction.locale,
						'shop#buy#error#no_account_description',
						{
							command: '</create account:1419159279935688795>',
						},
					),
				);

				return res.update().v2([errorContainer]);
			}

			const shopItems = {
				ringmarried: {
					name: replyLang(interaction.locale, 'shop#select#ring_to_married'),
					price: 6000,
					emoji: '💍',
				},
			};

			const item = shopItems[itemId as keyof typeof shopItems];

			if (!item || userAccount.balance < item.price) {
				const errorContainer = createContainer(
					'#ed4245',
					createThumbArea(
						brBuilder([
							`${emotes.utils.crossmark} | ${replyLang(
								interaction.locale,
								'shop#buy#error#generic_error_title',
							)}`,
							replyLang(
								interaction.locale,
								'shop#buy#error#generic_error_description',
							),
						]),
						images.koxik.cry,
					),
				);

				return res.update().v2([errorContainer]);
			}

			try {
				const sucessContainer = createContainer(
					'#00bc7d',
					`${emotes.utils.checkmark} | ${replyLang(interaction.locale, 'shop#buy#success#title')}`,
					replyLang(interaction.locale, 'shop#buy#success#description', {
						item_name: item.name,
						item_price: item.price,
						new_balance: userAccount.balance - item.price,
					}),
				);

				return res.update().v2([sucessContainer]);
			} catch (error) {
				console.error('Erro ao processar compra:', error);

				const errorContainer = createContainer(
					'#ed4245',
					createThumbArea(
						brBuilder([
							`${emotes.utils.crossmark} | ${replyLang(
								interaction.locale,
								'shop#buy#error#transaction_failed_title',
							)}`,
							replyLang(
								interaction.locale,
								'shop#buy#error#transaction_failed_description',
							),
						]),
						images.koxik.cry,
					),
				);

				return res.update().v2([errorContainer]);
			}
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'cancel/buy',
		type: 'button',
		run: async ({ interaction, res }) => {
			const cancelledContainer = createContainer(
				'#ed4245',
				createThumbArea(
					brBuilder([
						`${emotes.utils.crossmark} | ${replyLang(interaction.locale, 'shop#buy#cancelled#title')}`,
						replyLang(interaction.locale, 'shop#buy#cancelled#description'),
					]),
					images.koxik.cry,
				),
			);

			return res.update().v2([cancelledContainer]);
		},
	}),
);
