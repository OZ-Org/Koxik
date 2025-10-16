import { prisma } from '@db';
import { type ClientEvents, GatewayIntentBits, Partials } from 'discord.js';
import { KoxikClient } from './bot/CustomClient.js';
import { setupInteractionHandler } from './bot/interactionHandler.js';
import { loadCommandsFromDisk, loadEventsFromDisk } from './bot/loaders.js';
import { syncCommands } from './bot/sync.js';
import type { BotOptions, Command, Event } from './bot/types.js';

export function createBot(options: BotOptions) {
	const client = new KoxikClient(
		{
			intents: [
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildModeration,
			],
			partials: [Partials.GuildMember, Partials.User],
		},
		Array.isArray(options.owner)
			? options.owner
			: options.owner
				? [options.owner]
				: [],
	);

	const commands = new Map<string, Command>();

	function createCommand(command: Command): Command {
		commands.set(command.data.name, command);
		return command;
	}

	function createEvent<T extends keyof ClientEvents>(
		event: Event<T>,
	): Event<T> {
		if (event.once) {
			client.once(event.name, (...args) =>
				event.run(...(args as ClientEvents[T])),
			);
		} else {
			client.on(event.name, (...args) =>
				event.run(...(args as ClientEvents[T])),
			);
		}
		return event;
	}

	setupInteractionHandler(client, commands);

	client.once('clientReady', async () => {
		console.log('✅ Connected in as', client.user?.tag ?? 'unknown', '!');
		await syncCommands(client, commands, options);
	});

	(async () => {
		process.on('unhandledRejection', console.error);
		process.on('uncaughtException', console.error);

		await prisma
			.$connect()
			.then(() => console.log('🌊 Connected to DB!'))
			.catch(() => console.error('❌ Could not connect to DB!'));

		await loadCommandsFromDisk(commands);
		await loadEventsFromDisk(createEvent);
		await client.login(options.token);
	})();

	return { client, createCommand, createEvent };
}
export { KoxikClient };
