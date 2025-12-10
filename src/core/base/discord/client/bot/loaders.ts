import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { env } from '@env';
import { logger } from '@fx/utils/logger.js';
import type { ClientEvents } from 'discord.js';
import type { Command, Event } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'..',
	'..',
	'app',
	'discord',
);

export async function loadCommandsFromDisk(
	commands: Map<string, Command>,
): Promise<void> {
	const commandsPath = path.join(ROOT, 'commands');

	logger.divider('Loading Commands');

	const folders = await readdir(commandsPath, { withFileTypes: true });
	const commandTable: { Name: string; File: string; Folder: string }[] = [];

	await Promise.all(
		folders.map(async (folder) => {
			if (!folder.isDirectory()) return;

			const folderPath = path.join(commandsPath, folder.name);
			const files = await readdir(folderPath);

			await Promise.all(
				files.map(async (file) => {
					if (!file.endsWith('.ts') && !file.endsWith('.js')) return;

					try {
						const filePath = path.join(folderPath, file);
						const fileUrl = pathToFileURL(filePath).href;
						const commandModule = await import(fileUrl);
						const command: Command = commandModule.default;

						if (!command?.data) {
							return logger.warn(`Invalid command (missing data) → ${file}`);
						}

						if (typeof command.run !== 'function') {
							return logger.warn(`Invalid command (missing run) → ${file}`);
						}

						commands.set(command.data.name, command);

						commandTable.push({
							Name: command.data.name,
							File: file,
							Folder: folder.name,
						});

						logger.success(`Loaded command → ${command.data.name}`);
					} catch (err) {
						logger.error(`Failed to load command ${file}`, err);
					}
				}),
			);
		}),
	);

	if (commandTable.length > 0) {
		if (env.NODE_ENV === 'development') {
			logger.info('Commands loaded:');
			logger.table(
				commandTable.map((c) => [c.Name, c.File, c.Folder]),
				['Name', 'File', 'Folder'],
			);
		}
	} else {
		logger.warn('No commands found.');
	}
}

export async function loadEventsFromDisk(
	createEvent: <T extends keyof ClientEvents>(event: Event<T>) => Event<T>,
): Promise<void> {
	const eventsPath = path.join(ROOT, 'events');

	logger.divider('Loading Events');

	const files = await readdir(eventsPath);
	const eventTable: { Name: string; File: string }[] = [];

	await Promise.all(
		files.map(async (file) => {
			if (!file.endsWith('.ts') && !file.endsWith('.js')) return;

			try {
				const filePath = path.join(eventsPath, file);
				const fileUrl = pathToFileURL(filePath).href;
				const eventModule = await import(fileUrl);

				const event = eventModule.default satisfies Event<keyof ClientEvents>;

				if (!event?.name || typeof event.run !== 'function') {
					return logger.warn(`Invalid event → ${file}`);
				}

				createEvent(event);

				eventTable.push({ Name: event.name, File: file });

				logger.success(`Loaded event → ${event.name}`);
			} catch (err) {
				logger.error(`Failed to load event ${file}`, err);
			}
		}),
	);

	if (eventTable.length > 0) {
		if (env.NODE_ENV === 'development') {
			logger.info('Events loaded:');
			logger.table(
				eventTable.map((e) => [e.Name, e.File]),
				['Name', 'File'],
			);
		}
	} else {
		logger.warn('No events found.');
	}
}
