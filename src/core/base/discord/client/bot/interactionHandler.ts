import { db } from '@basedir/db/db.js';
import { commandStat } from '@basedir/db/schemas.js';
import { logger } from '@fx/utils/logger.js';
import type { ChatInputCommandInteraction, Interaction } from 'discord.js';
import { sql } from 'drizzle-orm';
import type { KoxikClient } from './CustomClient.js';
import { MiddlewareManager } from './middleware.js';
import { ReplyBuilder } from './ReplyBuilder.js';
import { getResponders } from './registry.js';
import type { Command, ComponentInteraction, InteractionMap } from './types.js';

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
					await interaction.deferReply({ flags: ['Ephemeral'] });
					logger.warn(`Auto-deferred → ${interaction.commandName}`);
				} catch (err) {
					logger.error(
						`Failed to auto-defer → ${interaction.commandName}`,
						err,
					);
				}
			}
		}, 2500);
		const res = new ReplyBuilder(interaction);
		await command.run({ client, interaction, res });
		hasResponded = true;
	} catch (err) {
		logger.error(`Error in command → ${interaction.commandName}`, err);

		try {
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content:
						'❌ Ocorreu um erro ao executar este comando. Tente novamente.',
					flags: ['Ephemeral'],
				});
			} else if (interaction.deferred) {
				await interaction.editReply({
					content:
						'❌ Ocorreu um erro ao executar este comando. Tente novamente.',
				});
			} else {
				await interaction.followUp({
					content:
						'❌ Ocorreu um erro ao executar este comando. Tente novamente.',
					flags: ['Ephemeral'],
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
	const middlewareManager = new MiddlewareManager();

	client.on('interactionCreate', async (interaction: Interaction) => {
		if (interaction.isChatInputCommand()) {
			const command = commands.get(interaction.commandName);
			if (!command) return;

			const middlewareResult = await middlewareManager.executeMiddlewares({
				client,
				interaction,
				command,
			});

			if (!middlewareResult.success) {
				await interaction
					.reply({
						content: '❌ An error occurred while processing this command.',
						flags: ['Ephemeral'],
					})
					.catch(() => {});
				return;
			}

			if (middlewareResult.response) {
				await interaction
					.reply({
						content: middlewareResult.response,
						flags: ['Ephemeral'],
					})
					.catch(() => {});
				return;
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
			return;
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
			return;
		}

		// Button, Modal, and Select Menu Interactions
		if (
			interaction.isButton() ||
			interaction.isModalSubmit() ||
			interaction.isStringSelectMenu() ||
			interaction.isChannelSelectMenu()
		) {
			await resolveResponder(interaction);
			return;
		}
	});
}

export async function resolveResponder(interaction: ComponentInteraction) {
	const type = interaction.isButton()
		? 'button'
		: interaction.isModalSubmit()
			? 'modal'
			: interaction.isStringSelectMenu()
				? 'stringSelect'
				: interaction.isChannelSelectMenu()
					? 'channelSelect'
					: null;

	if (!type) return;

	try {
		for (const responder of getResponders()) {
			if (responder.type !== type) continue;
			if (!responder.__regex) continue;

			const match = interaction.customId.match(responder.__regex);
			if (!match) continue;

			const params: Record<string, string> = {};
			responder.__keys?.forEach((key, i) => {
				params[key] = match[i + 1];
			});

			await responder.run({
				interaction: interaction as InteractionMap[typeof type],
				useParams: () => params,
				res: new ReplyBuilder(interaction),
			});
			break;
		}
	} catch (error) {
		logger.error(
			`Error in ${type} responder (${interaction.customId}):`,
			error,
		);

		if (!interaction.replied && !interaction.deferred) {
			await interaction
				.reply({
					content: '❌ An error occurred while processing this interaction.',
					flags: ['Ephemeral'],
				})
				.catch(() => {});
		} else if (interaction.deferred) {
			await interaction
				.editReply({
					content: '❌ An error occurred while processing this interaction.',
				})
				.catch(() => {});
		}
	}
}
