import { logger } from '@fx/utils/logger.js';
import { type ApplicationCommand, type Client, REST, Routes } from 'discord.js';
import type { BotOptions, Command, RegisterType } from './types.js';

type RegisterTargets = {
	global: boolean;
	guilds: Set<string>;
};

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

	logger.divider('Slash Command Sync');

	await cleanupGlobal(rest, client.user.id, targets.global);

	for (const [guildId] of client.guilds.cache) {
		const allowed = targets.guilds.has(guildId);
		await cleanupGuild(rest, client.user.id, guildId, allowed);
	}

	if (targets.global) {
		logger.info('Registering global commands');

		await rest.put(Routes.applicationCommands(client.user.id), { body });

		logger.success('Global commands synchronized');
	}

	for (const guildId of targets.guilds) {
		logger.info(`Registering commands in guild → ${guildId}`);

		await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), {
			body,
		});

		logger.success(`Commands synchronized in guild → ${guildId}`);
	}
}
