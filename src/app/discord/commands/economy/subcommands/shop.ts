import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { createContainer, createRow, Separator } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import {
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from 'discord.js';

const shopSubCommand = createSubCommand({
	name: 'shop',
	description: 'Veja a lojinha do bot!',
	name_localizations: {
		'pt-BR': 'lojinha',
	},
	run: async ({ interaction, res }) => {
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
							.setLabel(replyLang(interaction.locale, 'shop#main#home_page'))
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

		return res.ephemeral().v2([container]);
	},
});

export { shopSubCommand };
