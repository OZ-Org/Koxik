import { RegisterType } from '@basedir/discord/client/bot/types.js';
import { createBot } from '@basedir/discord/client/KoxikClient.js';

export const { createCommand, createEvent } = createBot({
	token: process.env.DISCORD_TOKEN as string,
	commands: {
		registerOn: RegisterType.Guild([
			'1426601171455311973',
			'1399909178495074304',
		]),
	},
});
