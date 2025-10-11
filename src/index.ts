import { createBot } from './base/discord/client/KoxikClient.js';

export const { createCommand, createEvent } = createBot({
	token: process.env.DISCORD_TOKEN as string,
	commands: {
		registerOn: '1399909178495074304',
	},
});
