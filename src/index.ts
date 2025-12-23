import { RegisterType } from '@basedir/discord/client/bot/types.js';

export { ApplicationCommandOptionType } from 'discord.js';

import { createBot } from '@basedir/discord/client/KoxikClient.js';
import { env } from '@env';

export const {
	createEvent,
	createCommand,
	createSubCommand,
	createSubCommandGroup,
	client,
} = createBot({
	token: env.DISCORD_TOKEN,
	commands: {
		registerOn: [
			RegisterType.Depends.Guild<'development'>('development', [
				'1426601171455311973',
				'1399909178495074304',
			]),
			RegisterType.Depends.Guild<'production'>('production', [
				'1445996370551902321',
			]),
		],
	},
});
