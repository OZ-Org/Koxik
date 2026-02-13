import { createResponder, registerResponder } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { createContainer, createRow, Separator } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import {
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from 'discord.js';

export type Items = 'ringmarried';

registerResponder(
	createResponder({
		customId: 'shop/bot',
		type: 'stringSelect',
		run: async ({ interaction, res }) => {
			const selected = interaction.values[0];

			function createItensRow(
				itens: {
					name: string;
					description: string;
					emoji: string;
					price: number;
					cid: string;
				}[],
			) {
				return createRow(
					new StringSelectMenuBuilder()
						.setCustomId('shop/roleplay/items')
						.setPlaceholder(
							replyLang(interaction.locale, 'shop#select#select_option'),
						)
						.addOptions(
							itens.map((item) =>
								new StringSelectMenuOptionBuilder()
									.setLabel(item.name)
									.setDescription(item.description)
									.setValue(`item/${item.cid}`)
									.setEmoji(item.emoji),
							),
						),
				);
			}

			function createRoleplayPage() {
				const itens = [
					{
						name: replyLang(interaction.locale, 'shop#select#ring_to_married'),
						description: replyLang(
							interaction.locale,
							'shop#select#ring_description',
						),
						cid: 'ringmarried',
						price: 6000,
						emoji: emotes.social.ring,
					},
				];

				const container = createContainer(
					'#e11d48',
					replyLang(interaction.locale, 'shop#select#roleplay_title'),
					Separator.Default,
					replyLang(interaction.locale, 'shop#select#roleplay_description'),
					createItensRow(itens),
					Separator.Default,
					replyLang(interaction.locale, 'shop#select#not_found_hint'),
					replyLang(interaction.locale, 'shop#select#not_found_hint2'),
					createRow(
						new StringSelectMenuBuilder()
							.setCustomId('shop/bot')
							.setPlaceholder(
								replyLang(interaction.locale, 'shop#select#select_option'),
							)
							.addOptions(
								new StringSelectMenuOptionBuilder()
									.setLabel(
										replyLang(interaction.locale, 'shop#select#home_page'),
									)
									.setValue('page/home')
									.setEmoji(emotes.ui.home),
								// new StringSelectMenuOptionBuilder()
								// 	.setLabel(
								// 		replyLang(
								// 			interaction.locale,
								// 			'shop#select#minecraft_items',
								// 		),
								// 	)
								// 	.setValue('page/minecraft')
								// 	.setEmoji(emotes.misc.mineDirt),
								new StringSelectMenuOptionBuilder()
									.setLabel(
										replyLang(interaction.locale, 'shop#select#roleplay_items'),
									)
									.setDescription(
										replyLang(interaction.locale, 'shop#select#you_are_here'),
									)
									.setDefault(true)
									.setValue('page/roleplay')
									.setEmoji(emotes.social.heart),
							),
					),
				);

				return res.update().v2([container]);
			}

			function createHomePage() {
				const container = createContainer(
					'#00bc7d',
					replyLang(interaction.locale, 'shop#main#title'),
					Separator.Default,
					replyLang(interaction.locale, 'shop#main#description'),

					createRow(
						new StringSelectMenuBuilder()
							.setCustomId('shop/bot')
							.setPlaceholder(
								replyLang(interaction.locale, 'shop#main#select_option'),
							)
							.addOptions(
								new StringSelectMenuOptionBuilder()
									.setLabel(
										replyLang(interaction.locale, 'shop#main#home_page'),
									)
									.setDefault(true)
									.setValue('page/home')
									.setEmoji(emotes.ui.home),
								new StringSelectMenuOptionBuilder()
									.setLabel(
										replyLang(interaction.locale, 'shop#main#minecraft_items'),
									)
									.setValue('page/minecraft')
									.setEmoji(emotes.misc.mineDirt),
								new StringSelectMenuOptionBuilder()
									.setLabel(
										replyLang(interaction.locale, 'shop#main#roleplay_items'),
									)
									.setValue('page/roleplay')
									.setEmoji(emotes.social.heart),
							),
					),
				);

				res.update().v2([container]);
			}

			switch (selected) {
				case 'page/roleplay':
					return createRoleplayPage();

				case 'page/home':
					return createHomePage();
				default:
					return;
			}
		},
	}),
);
