import { logger } from '@fx/utils/logger.js';
import { type ApplicationCommand, type Client, REST, Routes } from 'discord.js';
import type { BotOptions, Command, RegisterType } from './types.js';

type RegisterTargets = {
	global: boolean;
	guilds: Set<string>;
};

interface RateLimitConfig {
	requests: number;
	window: number; // in milliseconds
}

class RateLimiter {
	private requests: number[] = [];
	private config: RateLimitConfig;

	constructor(config: RateLimitConfig) {
		this.config = config;
	}

	async waitForSlot(): Promise<void> {
		const now = Date.now();
		this.requests = this.requests.filter(
			(time) => now - time < this.config.window,
		);

		if (this.requests.length >= this.config.requests) {
			const oldestRequest = this.requests[0];
			const waitTime = this.config.window - (now - oldestRequest);

			if (waitTime > 0) {
				logger.debug(`Rate limit reached, waiting ${waitTime}ms`);
				await new Promise((resolve) => setTimeout(resolve, waitTime));
			}
		}

		this.requests.push(now);
	}
}

function resolveRegisterTargets(
	registerOn: RegisterType | RegisterType[],
): RegisterTargets {
	const targets: RegisterTargets = {
		global: false,
		guilds: new Set(),
	};

	const list = Array.isArray(registerOn) ? registerOn : [registerOn];

	for (const entry of list) {
		if (entry.type === 'Global') {
			targets.global = true;
		}

		if (entry.type === 'Guild') {
			for (const guild of entry.guilds) {
				targets.guilds.add(guild);
			}
		}
	}

	return targets;
}

async function cleanupGlobal(rest: REST, appId: string, allowed: boolean) {
	const existing = (await rest.get(
		Routes.applicationCommands(appId),
	)) as ApplicationCommand[];

	if (allowed) return;

	if (!existing.length) return;

	logger.warn(`Removing ${existing.length} global commands (not allowed)`);

	await rest.put(Routes.applicationCommands(appId), { body: [] });
}

async function cleanupGuild(
	rest: REST,
	appId: string,
	guildId: string,
	allowed: boolean,
) {
	const existing = (await rest.get(
		Routes.applicationGuildCommands(appId, guildId),
	)) as ApplicationCommand[];

	if (allowed) return;

	if (!existing.length) return;

	logger.warn(`Removing ${existing.length} commands from guild → ${guildId}`);

	await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });
}

async function executeWithRateLimit<T>(
	rateLimiter: RateLimiter,
	operation: () => Promise<T>,
): Promise<T> {
	await rateLimiter.waitForSlot();
	return operation();
}

export async function syncCommands(
	client: Client,
	commandMap: Map<string, Command>,
	options: BotOptions,
) {
	const { token, commands } = options;

	if (!commands?.registerOn) {
		logger.warn('No registerOn resolved → skipping sync');
		return;
	}

	if (!client.user) {
		throw new Error('Bot not ready');
	}

	const rest = new REST({ version: '10' }).setToken(token);
	const body = [...commandMap.values()].map((c) => c.data.toJSON());

	const targets = resolveRegisterTargets(commands.registerOn);

	// Configure rate limiting: 5 requests per 10 seconds
	const rateLimiter = new RateLimiter({
		requests: 5,
		window: 1000,
	});

	logger.divider('Slash Command Sync');

	const clientId = client.user.id;

	await executeWithRateLimit(rateLimiter, () =>
		cleanupGlobal(rest, clientId, targets.global),
	);

	for (const [guildId] of client.guilds.cache) {
		const allowed = targets.guilds.has(guildId);
		await executeWithRateLimit(rateLimiter, () =>
			cleanupGuild(rest, clientId, guildId, allowed),
		);
	}

	if (targets.global) {
		logger.info('Registering global commands');

		await executeWithRateLimit(rateLimiter, () =>
			rest.put(Routes.applicationCommands(clientId), { body }),
		);

		logger.success('Global commands synchronized');
	}

	for (const guildId of targets.guilds) {
		logger.info(`Registering commands in guild → ${guildId}`);

		await executeWithRateLimit(rateLimiter, () =>
			rest.put(Routes.applicationGuildCommands(clientId, guildId), {
				body,
			}),
		);

		logger.success(`Commands synchronized in guild → ${guildId}`);
	}

	if (targets.global) {
		logger.info('Registering global commands');

		await executeWithRateLimit(rateLimiter, () =>
			rest.put(Routes.applicationCommands(clientId), { body }),
		);

		logger.success('Global commands synchronized');
	}

	for (const guildId of targets.guilds) {
		logger.info(`Registering commands in guild → ${guildId}`);

		await executeWithRateLimit(rateLimiter, () =>
			rest.put(Routes.applicationGuildCommands(clientId, guildId), {
				body,
			}),
		);

		logger.success(`Commands synchronized in guild → ${guildId}`);
	}
}
