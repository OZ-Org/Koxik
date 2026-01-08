import { RegisterType } from '@basedir/discord/client/bot/types.js';

export { ApplicationCommandOptionType } from 'discord.js';

import { createBot } from '@basedir/discord/client/KoxikClient.js';
import { env } from '@env';

export const {
	createEvent,
	createCommand,
	createSubCommand,
	createSubCommandGroup,
	createResponder,
	registerResponder,
	client,
} = createBot({
	token: env.DISCORD_TOKEN,
	commands: {
		registerOn: [
			RegisterType.Depends.Guild<'development'>('development', [
				'1064302594366898257',
			]),
			RegisterType.Depends.Global<'production'>('production'),
		],
	},
});
