import { db } from '@basedir/db/db.js';
import { commandStat, blacklist } from '@basedir/db/schemas.js';
import { logger } from '@fx/utils/logger.js';
import type { ChatInputCommandInteraction, Interaction } from 'discord.js';
import { sql } from 'drizzle-orm';
import type { KoxikClient } from './CustomClient.js';
import type { Command } from './types.js';

/**
 * Safely handles interaction responses with timeout protection
 */
async function safeExecuteCommand(
	command: Command,
	client: KoxikClient,
	interaction: ChatInputCommandInteraction,
) {
	let hasResponded = false;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	try {
		timeoutId = setTimeout(async () => {
			if (!hasResponded && !interaction.replied && !interaction.deferred) {
				try {
					await interaction.deferReply({ flags: ["Ephemeral"] });
					logger.warn(`Auto-deferred → ${interaction.commandName}`);
				} catch (err) {
					logger.error(
						`Failed to auto-defer → ${interaction.commandName}`,
						err,
					);
				}
			}
		}, 2500);

		await command.run({ client, interaction });
		hasResponded = true;
	} catch (err) {
		logger.error(`Error in command → ${interaction.commandName}`, err);

		try {
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: '❌ Ocorreu um erro ao executar este comando. Tente novamente.',
					flags: ["Ephemeral"],
				});
			} else if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Ocorreu um erro ao executar este comando. Tente novamente.'
				});
			} else {
				await interaction.followUp({
					content: '❌ Ocorreu um erro ao executar este comando. Tente novamente.',
					flags: ["Ephemeral"],
				});
			}
		} catch (replyErr) {
			logger.error('Failed to send error reply to user:', replyErr);
		}
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
}

export function setupInteractionHandler(
	client: KoxikClient,
	commands: Map<string, Command>,
) {
	client.on('interactionCreate', async (interaction: Interaction) => {
		// Slash Commands
		if (interaction.isChatInputCommand()) {
			const command = commands.get(interaction.commandName);
			if (!command) return;

			try {
				const userBlacklisted = await db
					.select()
					.from(blacklist)
					.where(sql`${blacklist.targetId} = ${interaction.user.id} AND ${blacklist.type} = 'user'`)
					.limit(1);

				if (userBlacklisted.length > 0) {
					await interaction.reply({
						content: '🚫 You are banned from KoxikBot.',
						flags: ["Ephemeral"],
					}).catch(() => { });
					return;
				}

				const guildBlacklisted = await db
					.select()
					.from(blacklist)
					.where(sql`${blacklist.targetId} = ${interaction.guildId} AND ${blacklist.type} = 'guild'`)
					.limit(1);

				if (guildBlacklisted.length > 0) {
					await interaction.reply({
						content: '🚫 This server is banned from KoxikBot.',
						flags: ["Ephemeral"],
					}).catch(() => { });
					return;
				}
			} catch (err) {
				logger.error('Blacklist check failed:', err);
			}

			let subcommand: string | null = null;
			try {
				subcommand = interaction.options.getSubcommand(false);
			} catch {
				subcommand = null;
			}

			const ignoreAnalytics =
				interaction.commandName === 'koxik' && subcommand === 'analytics';

			// Log usage
			if (!ignoreAnalytics) {
				(async () => {
					try {
						const date = new Date();
						date.setHours(0, 0, 0, 0);

						await db
							.insert(commandStat)
							.values({
								date: date.toISOString(),
								command: interaction.commandName,
								subcommand: subcommand ?? '__name__',
								count: 1,
							})
							.onConflictDoUpdate({
								target: [
									commandStat.date,
									commandStat.command,
									commandStat.subcommand,
								],
								set: { count: sql`${commandStat.count} + 1` },
							});
					} catch (err) {
						logger.error('Failed to log command usage:', err);
					}
				})();
			}

			// Safe execution
			await safeExecuteCommand(command, client, interaction);
		}

		// Autocomplete
		if (interaction.isAutocomplete()) {
			const command = commands.get(interaction.commandName);
			if (!command?.autocomplete) return;

			try {
				await command.autocomplete({ client, interaction });
			} catch (err) {
				logger.error(`Autocomplete error → ${interaction.commandName}`, err);
			}
		}
	});
}
