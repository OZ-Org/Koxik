import { type ApplicationCommand, type Client, REST, Routes } from 'discord.js';
import type { BotOptions, Command } from './types.js';

export async function syncCommands(
	client: Client,
	commands: Map<string, Command>,
	options: BotOptions,
) {
	if (!options.commands?.registerOn) return;

	const rest = new REST({ version: '10' }).setToken(options.token);
	const body = Array.from(commands.values()).map((c) => c.data.toJSON());

	if (!client.user) throw new Error('The bot is not ready yet!');

	let existing: ApplicationCommand[] = [];

	if (options.commands.registerOn === 'global') {
		// --- Sincroniza globais ---
		existing = (await rest.get(
			Routes.applicationCommands(client.user.id),
		)) as ApplicationCommand[];
		console.log(`🌍 Current global commands: ${existing.length}`);
		await rest.put(Routes.applicationCommands(client.user.id), { body });
		console.log('✅ Global commands synchronized!');

		// --- Remove todos os comandos de guildas ---
		if (client.guilds.cache.size > 0) {
			for (const [guildId] of client.guilds.cache) {
				try {
					await rest.put(
						Routes.applicationGuildCommands(client.user.id, guildId),
						{ body: [] },
					);
					console.log(`🧹 Cleared guild commands in ${guildId}`);
				} catch (err) {
					console.warn(`⚠️ Failed to clear guild ${guildId}:`, err);
				}
			}
		}
	} else {
		const guildId = options.commands.registerOn;
		// --- Sincroniza comandos na guild ---
		existing = (await rest.get(
			Routes.applicationGuildCommands(client.user.id, guildId),
		)) as ApplicationCommand[];
		console.log(`🏠 Current commands in guild ${guildId}: ${existing.length}`);
		await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), {
			body,
		});
		console.log(`✅ Commands synchronized in guild ${guildId}!`);

		// --- Remove todos os comandos globais ---
		await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
		console.log('🧹 Cleared all global commands!');
	}

	// logs de diferença
	const newNames = new Set(commands.keys());
	const oldNames = new Set(existing.map((c) => c.name));

	for (const old of oldNames) {
		if (!newNames.has(old)) console.log(`❌ Command removed: ${old}`);
	}
	for (const newCmd of newNames) {
		if (!oldNames.has(newCmd)) console.log(`➕ Command added: ${newCmd}`);
	}
}
