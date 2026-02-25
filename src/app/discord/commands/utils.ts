import { replyLang } from '@fx/utils/replyLang.js';
import { EmbedPlusBuilder } from '@magicyan/discord';
import { images } from '@misc/emotes.js';
import { Colors, type Locale, type User } from 'discord.js';

export function createErrorEmbed(
	locale: Locale,
	title: string,
	description: string,
): EmbedPlusBuilder {
	return new EmbedPlusBuilder({
		color: Colors.Red,
		title: `❌ ${title}`,
		description,
		thumbnail: images.koxik.cry,
		timestamp: new Date(),
		footer: { text: replyLang(locale, 'eco#footer#error') },
	});
}

export function createSuccessEmbed(
	title: string,
	description: string,
): EmbedPlusBuilder {
	return new EmbedPlusBuilder({
		color: Colors.Green,
		title: `✅ ${title}`,
		description,
		timestamp: new Date(),
	});
}

export function createConfirmationEmbed(
	_locale: Locale,
	options: {
		title: string;
		description: string;
		user: User;
		targetUser?: User;
	},
): EmbedPlusBuilder {
	const embed: EmbedPlusBuilder = new EmbedPlusBuilder({
		color: Colors.Yellow,
		title: options.title,
		author: {
			name: options.user.displayName,
			iconURL: options.user.displayAvatarURL(),
		},
		description: options.description,
		timestamp: new Date(),
	});

	if (options.targetUser) {
		embed.setThumbnail(options.targetUser.displayAvatarURL({ size: 128 }));
	}

	return embed;
}
