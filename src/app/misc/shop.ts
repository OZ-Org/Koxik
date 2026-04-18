import { replyLang } from '@fx/utils/replyLang.js';
import { emotes } from './emotes.js';
import type { Locale } from 'discord.js';

export function getShopI(locale: Locale) {
	return [
		{
			name: replyLang(locale, 'shop#items#ring_to_married#name'),
			description: replyLang(locale, 'shop#items#ring_to_married#description'),
			cid: 'ringmarried',
			price: 6000,
			emoji: emotes.social.ring,
		},
	];
}
