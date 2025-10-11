import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ClientEvents } from 'discord.js';
import type { Command, Event } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommandsFromDisk(
	commands: Map<string, Command>,
): Promise<void> {
	const commandsPath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'..',
		'discord',
		'commands',
	);
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

						if (!command?.data || typeof command.run !== 'function') {
							console.warn(`⚠️ Invalid command in ${file}`);
							return;
						}

						commands.set(command.data.name, command);
						commandTable.push({
							Name: command.data.name,
							File: file,
							Folder: folder.name,
						});
					} catch (err) {
						console.error(`❌ Failed to load command ${file}:`, err);
					}
				}),
			);
		}),
	);

	if (commandTable.length > 0) {
		if (process.env.NODE_ENV === 'development') {
			console.log('\n📜 Commands loaded from folder:');
			console.table(commandTable);
		}
	} else {
		console.log('⚠️ No commands found.');
	}
}

export async function loadEventsFromDisk(
	createEvent: <T extends keyof ClientEvents>(event: Event<T>) => Event<T>,
): Promise<void> {
	const eventsPath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'..',
		'discord',
		'events',
	);
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
					console.warn(`⚠️ Invalid event in ${file}`);
					return;
				}

				createEvent(event);
				eventTable.push({ Name: event.name, File: file });
			} catch (err) {
				console.error(`❌ Failed to load event ${file}:`, err);
			}
		}),
	);

	if (eventTable.length > 0) {
		if (process.env.NODE_ENV === 'development') {
			console.log('\n🎧 Events loaded from folder:');
			console.table(eventTable);
		}
	} else {
		console.log('⚠️ No events found.');
	}
}
