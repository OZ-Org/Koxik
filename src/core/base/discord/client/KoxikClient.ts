// createBot.ts
import { db } from '@basedir/db/db.js';
import { env } from '@env';
import { logger } from '@fx/utils/logger.js';
import { type ClientEvents, GatewayIntentBits, Partials } from 'discord.js';
import { KoxikClient } from './bot/CustomClient.js';
import {
	createCommand as createCommandBuilder,
	createSubCommand,
	createSubCommandGroup,
} from './bot/command-structure.js';
import { setupInteractionHandler } from './bot/interactionHandler.js';
import { loadCommandsFromDisk, loadEventsFromDisk } from './bot/loaders.js';
import { syncCommands } from './bot/sync.js';
import type { BotOptions, Command, Event, RegisterType } from './bot/types.js';

export function resolveRegisterTypes(
	list: RegisterType[],
): RegisterType | null {
	const envNow = env.NODE_ENV ?? 'development';

	for (const reg of list) {
		if (reg.type === 'DependsGlobal' && reg.env === envNow) {
			return { type: 'Global' };
		}

		if (reg.type === 'DependsGuild' && reg.env === envNow) {
			return { type: 'Guild', guilds: reg.guilds };
		}

		if (reg.type === 'Global' || reg.type === 'Guild') {
			return reg;
		}
	}

	return null;
}

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

	const registeredEvents = new Set<string>();

	function createEvent<T extends keyof ClientEvents>(event: Event<T>) {
		if (registeredEvents.has(event.name)) {
			logger.warn(`Event already registered → ${event.name}`);
			return event;
		}

		registeredEvents.add(event.name);

		const handler = (...args: ClientEvents[T]) => event.run(...args);

		event.once
			? client.once(event.event, handler)
			: client.on(event.event, handler);

		return event;
	}

	setupInteractionHandler(client, commands);

	client.once('clientReady', async () => {
		logger.info(`Connected as ${client.user?.tag ?? 'unknown'}`);

		if (Array.isArray(options.commands?.registerOn)) {
			const resolved = resolveRegisterTypes(options.commands.registerOn);

			if (resolved) {
				options.commands.registerOn = resolved;
			} else {
				options.commands.registerOn = [];
			}
		}

		await syncCommands(client, commands, options);
	});

	(async () => {
		process.on('unhandledRejection', (err) =>
			logger.error('Unhandled Rejection', err),
		);

		process.on('uncaughtException', (err) =>
			logger.error('Uncaught Exception', err),
		);

		await db.$client
			.connect()
			.then(() => logger.info('Connected to DB'))
			.catch(() => {
				logger.error('Could not connect to DB');
				process.exit(0);
			});

		await loadCommandsFromDisk(commands);
		await loadEventsFromDisk(createEvent);

		await client.login(options.token);
	})();

	return {
		client,
		createCommand: createCommandBuilder,
		createEvent,
		createSubCommand,
		createSubCommandGroup,
	};
}
