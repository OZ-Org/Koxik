import {
	RegisterType,
	ShardingType,
} from '@basedir/discord/client/bot/types.js';

import { createBot } from '@basedir/discord/client/KoxikClient.js';
import { env } from '@env';
import { ApplicationCommandOptionType } from 'discord.js';

export { ApplicationCommandOptionType };

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

	sharding: [
		ShardingType.Internal<'development'>('development', {
			count: 2,
		}),

		ShardingType.Internal<'production'>('production', {
			count: 'auto',
		}),
	],

	commands: {
		registerOn: [
			RegisterType.Depends.Guild<'development'>('development', [
				'1399909178495074304',
			]),
			RegisterType.Depends.Global<'production'>('production'),
		],
	},
});
