import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { env } from '@env';
import { logger } from '@fx/utils/logger.js';
import type { ClientEvents } from 'discord.js';
import type { Command, Event } from './types.js';

const __dirname = path.dirname(path.resolve(import.meta.filename));
const ROOT = path.join(__dirname, '../../../../../app/discord');

export async function loadCommandsFromDisk(
	commands: Map<string, Command>,
): Promise<void> {
	const commandsPath = path.join(ROOT, 'commands');

	logger.divider('Loading Commands');

	const folders = await readdir(commandsPath, { withFileTypes: true });
	const commandTable: { Name: string; File: string; Folder: string }[] = [];

	for (const folder of folders) {
		if (!folder.isDirectory()) continue;

		const folderPath = path.join(commandsPath, folder.name);
		const files = await readdir(folderPath);

		for (const file of files) {
			// Bun = sem .js
			if (!file.endsWith('.ts')) continue;

			try {
				const filePath = path.join(folderPath, file);
				const fileUrl = pathToFileURL(filePath).href;

				const commandModule = await import(fileUrl);
				const command = commandModule.default;

				if (!command) {
					logger.warn(`Invalid command (missing export) → ${file}`);
					continue;
				}

				if (!command.data) {
					logger.warn(`Invalid command (missing data) → ${file}`);
					continue;
				}

				if (typeof command.run !== 'function') {
					logger.warn(`Invalid command (missing run) → ${file}`);
					continue;
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
		}
	}

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
async function walk(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });

	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...(await walk(fullPath)));
		} else if (
			entry.isFile() &&
			/\.(ts|js)$/.test(entry.name) &&
			!entry.name.endsWith('.d.ts')
		) {
			files.push(fullPath);
		}
	}

	return files;
}

const RESPONDERS_DIR = path.join(
	__dirname,
	'../../../../../app/discord/responders',
);

export async function loadResponders() {
	const files = await walk(RESPONDERS_DIR);

	for (const file of files) {
		await import(pathToFileURL(file).href);
	}
}
export async function loadEventsFromDisk(
	createEvent: <T extends keyof ClientEvents>(event: Event<T>) => Event<T>,
): Promise<void> {
	const eventsPath = path.join(ROOT, 'events');

	logger.divider('Loading Events');

	const files = await readdir(eventsPath);
	const eventTable: { Name: string; File: string }[] = [];

	for (const file of files) {
		if (!file.endsWith('.ts')) continue;

		try {
			const filePath = path.join(eventsPath, file);
			const fileUrl = pathToFileURL(filePath).href;

			const eventModule = await import(fileUrl);
			const event = eventModule.default as Event<keyof ClientEvents> & {
				__registered?: boolean;
			};

			if (!event?.name || typeof event.run !== 'function') {
				logger.warn(`Invalid event → ${file}`);
				continue;
			}

			if (!event.__registered) {
				createEvent(event);
				event.__registered = true;
			}

			eventTable.push({ Name: event.name, File: file });
			logger.success(`Loaded event → ${event.name}`);
		} catch (err) {
			logger.error(`Failed to load event ${file}`, err);
		}
	}

	if (eventTable.length > 0 && env.NODE_ENV === 'development') {
		logger.info('Events loaded:');
		logger.table(
			eventTable.map((e) => [e.Name, e.File]),
			['Name', 'File'],
		);
	}
}
