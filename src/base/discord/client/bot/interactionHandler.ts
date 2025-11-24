import { prisma } from '@db';
import { logger } from '@fx/utils/logger.js';
import type { Interaction } from 'discord.js';
import type { KoxikClient } from './CustomClient.js';
import type { Command } from './types.js';

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

			if (!shouldIgnore) {
				try {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const subcommand = subcommandName ?? '__name__';

					await prisma.commandStat.upsert({
						where: {
							date_command_sub: {
								date: today,
								command: interaction.commandName,
								subcommand,
							},
						},
						update: { count: { increment: 1 } },
						create: {
							date: today,
							command: interaction.commandName,
							subcommand,
							count: 1,
						},
					});
				} catch (err) {
					logger.error(
						'Error while trying to create the log of commands used:',
						err,
					);
				}
			}

			try {
				await command.run(client, interaction);
			} catch (err) {
				console.error(`Error in command ${interaction.commandName}:`, err);
			}
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
