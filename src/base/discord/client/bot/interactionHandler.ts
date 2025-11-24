import { db } from '@db';
import { logger } from '@fx/utils/logger.js';
import type { Interaction, ChatInputCommandInteraction } from 'discord.js';
import type { KoxikClient } from './CustomClient.js';
import type { Command } from './types.js';
import { commandStat } from '@schemas';
import { sql } from 'drizzle-orm';

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
		// Auto-defer after 2.5 seconds if command hasn't responded
		timeoutId = setTimeout(async () => {
			if (!hasResponded && !interaction.replied && !interaction.deferred) {
				try {
					await interaction.deferReply({ ephemeral: true });
					logger.warn(
						`Auto-deferred interaction for command: ${interaction.commandName}`,
					);
				} catch (err) {
					logger.error('Failed to auto-defer interaction:', err);
				}
			}
		}, 2500);

		// Execute the command
		await command.run(client, interaction);
		hasResponded = true;
	} catch (err) {
		console.error(`Error in command ${interaction.commandName}:`, err);

		// Try to send error message to user
		try {
			const errorMessage = {
				content: '❌ Ocorreu um erro ao executar este comando. Tente novamente.',
				ephemeral: true,
			};

			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply(errorMessage);
			} else if (interaction.deferred) {
				await interaction.editReply(errorMessage);
			} else {
				await interaction.followUp(errorMessage);
			}
		} catch (replyErr) {
			logger.error('Failed to send error message to user:', replyErr);
		}
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}

export function setupInteractionHandler(
	client: KoxikClient,
	commands: Map<string, Command>,
) {
	client.on('interactionCreate', async (interaction: Interaction) => {
		// Slash commands
		if (interaction.isChatInputCommand()) {
			const command = commands.get(interaction.commandName);
			if (!command) return;

			let subcommandName: string | null = null;
			try {
				subcommandName = interaction.options.getSubcommand(false);
			} catch {
				subcommandName = null;
			}

			const shouldIgnore =
				interaction.commandName === 'koxik' && subcommandName === 'analytics';

			// Log command usage (async, non-blocking)
			if (!shouldIgnore) {
				(async () => {
					try {
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						const subcommand = subcommandName ?? '__name__';

						await db
							.insert(commandStat)
							.values({
								date: today.toISOString(),
								command: interaction.commandName,
								subcommand,
								count: 1,
							})
							.onConflictDoUpdate({
								target: [
									commandStat.date,
									commandStat.command,
									commandStat.subcommand,
								],
								set: {
									count: sql`${commandStat.count} + 1`,
								},
							});
					} catch (err) {
						logger.error(
							'Error while trying to create the log of commands used:',
							err,
						);
					}
				})();
			}

			// Execute command with safety wrapper
			await safeExecuteCommand(command, client, interaction);
		}

		// Autocomplete
		if (interaction.isAutocomplete()) {
			const command = commands.get(interaction.commandName);
			if (command?.autocomplete) {
				try {
					await command.autocomplete(client, interaction);
				} catch (err) {
					console.error(
						`Error in autocomplete for ${interaction.commandName}:`,
						err,
					);
				}
			}
		}
	});
}
