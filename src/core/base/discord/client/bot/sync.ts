// sync.ts
import { logger } from '@fx/utils/logger.js';
import { type ApplicationCommand, type Client, REST, Routes } from 'discord.js';
import type { BotOptions, Command, RegisterType } from './types.js';

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

	if (!client.user) throw new Error('The bot is not ready yet!');

	const registerOn = commands.registerOn as RegisterType | null;

	if (!registerOn) {
		logger.warn('No registerOn resolved → skipping sync');
		return;
	}

	const rest = new REST({ version: '10' }).setToken(token);
	const body = Array.from(commandMap.values()).map((c) => c.data.toJSON());

	let existing: ApplicationCommand[] = [];

	logger.divider('Syncing Slash Commands');

	// ---------------------------
	// GLOBAL
	// ---------------------------
	if (registerOn.type === 'Global') {
		existing = (await rest.get(
			Routes.applicationCommands(client.user.id),
		)) as ApplicationCommand[];

		logger.info(`Global commands found: ${existing.length}`);
		await rest.put(Routes.applicationCommands(client.user.id), { body });

		logger.success('Global commands synchronized');

		for (const [guildId] of client.guilds.cache) {
			try {
				await rest.put(
					Routes.applicationGuildCommands(client.user.id, guildId),
					{ body: [] },
				);
				logger.info(`Cleared guild commands → ${guildId}`);
			} catch (err) {
				logger.warn(`Failed to clear guild → ${guildId}`, err);
			}
		}
	}

	// ---------------------------
	// GUILD
	// ---------------------------
	else if (registerOn.type === 'Guild') {
		for (const guildId of registerOn.guilds) {
			try {
				existing = (await rest.get(
					Routes.applicationGuildCommands(client.user.id, guildId),
				)) as ApplicationCommand[];

				logger.info(`Guild ${guildId} commands found: ${existing.length}`);

				await rest.put(
					Routes.applicationGuildCommands(client.user.id, guildId),
					{ body },
				);

				logger.success(`Commands synchronized in guild → ${guildId}`);
			} catch (err) {
				logger.warn(`Failed to sync guild → ${guildId}`, err);
			}
		}

		await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
		logger.info('Cleared all global commands');
	}

	// TABLE
	const newNames = new Set(commandMap.keys());
	const oldNames = new Set(existing.map((c) => c.name));

	const removed = [...oldNames].filter((old) => !newNames.has(old));
	const added = [...newNames].filter((n) => !oldNames.has(n));

	logger.info('Command changes:');
	if (removed.length > 0) {
		logger.info(`Removed commands: ${removed.join(', ')}`);
	}
	if (added.length > 0) {
		logger.info(`Added commands: ${added.join(', ')}`);
	}
}
