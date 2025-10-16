import { type ApplicationCommand, type Client, REST, Routes } from 'discord.js';
import type { BotOptions, Command } from './types.js';

export async function syncCommands(
	client: Client,
	commandMap: Map<string, Command>,
	options: BotOptions,
) {
	const { token, commands } = options;

	if (!commands?.registerOn) return;
	if (!client.user) throw new Error('🚫 The bot is not ready yet!');

	const registerOn = commands.registerOn;
	const rest = new REST({ version: '10' }).setToken(token);
	const body = Array.from(commandMap.values()).map((c) => c.data.toJSON());

	let existing: ApplicationCommand[] = [];

	// 🌍 Modo Global
	if (registerOn.type === 'Global') {
		existing = (await rest.get(
			Routes.applicationCommands(client.user.id),
		)) as ApplicationCommand[];

		console.log(`🌍 Current global commands: ${existing.length}`);
		await rest.put(Routes.applicationCommands(client.user.id), { body });
		console.log('✅ Global commands synchronized!');

		// limpa todas as guilds
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

	// 🏠 Modo Guild
	else if (registerOn.type === 'Guild') {
		for (const guildId of registerOn.guilds) {
			try {
				existing = (await rest.get(
					Routes.applicationGuildCommands(client.user.id, guildId),
				)) as ApplicationCommand[];

				console.log(
					`🏠 Current commands in guild ${guildId}: ${existing.length}`,
				);

				await rest.put(
					Routes.applicationGuildCommands(client.user.id, guildId),
					{
						body,
					},
				);
				console.log(`✅ Commands synchronized in guild ${guildId}!`);
			} catch (err) {
				console.warn(`⚠️ Failed to sync guild ${guildId}:`, err);
			}
		}

		// limpa globais
		await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
		console.log('🧹 Cleared all global commands!');
	}

	// 🧾 Log de mudanças
	const newNames = new Set(commandMap.keys());
	const oldNames = new Set(existing.map((c) => c.name));

	for (const old of oldNames) {
		if (!newNames.has(old)) console.log(`❌ Command removed: ${old}`);
	}
	for (const newCmd of newNames) {
		if (!oldNames.has(newCmd)) console.log(`➕ Command added: ${newCmd}`);
	}
}
