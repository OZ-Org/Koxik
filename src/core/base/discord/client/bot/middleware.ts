import { db } from '@basedir/db/db.js';
import { blacklist } from '@basedir/db/schemas.js';
import { logger } from '@fx/utils/logger.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { sql } from 'drizzle-orm';
import type { KoxikClient } from './CustomClient.js';
import type { Command } from './types.js';

export interface MiddlewareContext {
	client: KoxikClient;
	interaction: ChatInputCommandInteraction;
	command: Command;
}

export type MiddlewareResult =
	| { success: true; continue: true }
	| { success: true; continue: false; response?: string }
	| { success: false; error: string; response?: string };

export abstract class CommandMiddleware {
	abstract name: string;
	abstract priority: number;

	abstract execute(context: MiddlewareContext): Promise<MiddlewareResult>;
}

export class BlacklistMiddleware extends CommandMiddleware {
	name = 'blacklist';
	priority = 100;

	async execute(context: MiddlewareContext): Promise<MiddlewareResult> {
		try {
			const blacklisted = await db
				.select()
				.from(blacklist)
				.where(
					sql`(${blacklist.targetId} = ${context.interaction.user.id} AND ${blacklist.type} = 'user') OR 
					  (${blacklist.targetId} = ${context.interaction.guildId} AND ${blacklist.type} = 'guild')`,
				)
				.limit(2);

			const userBlacklisted = blacklisted.some(
				(entry) =>
					entry.targetId === context.interaction.user.id &&
					entry.type === 'user',
			);

			const guildBlacklisted = blacklisted.some(
				(entry) =>
					entry.targetId === context.interaction.guildId &&
					entry.type === 'guild',
			);

			if (userBlacklisted) {
				return {
					success: true,
					continue: false,
					response: '🚫 You are banned from KoxikBot.',
				};
			}

			if (guildBlacklisted) {
				return {
					success: true,
					continue: false,
					response: '🚫 This server is banned from KoxikBot.',
				};
			}

			return { success: true, continue: true };
		} catch (error) {
			logger.error('Blacklist middleware failed:', error);
			return { success: false, error: 'Blacklist check failed' };
		}
	}
}

export class CooldownMiddleware extends CommandMiddleware {
	private cooldowns = new Map<string, Map<string, number>>();
	name = 'cooldown';
	priority = 90;

	async execute(context: MiddlewareContext): Promise<MiddlewareResult> {
		const commandName = context.command.data.name;
		const userId = context.interaction.user.id;
		const cooldownTime = context.command.cooldown || 3000; // 3 seconds default

		if (!this.cooldowns.has(commandName)) {
			this.cooldowns.set(commandName, new Map());
		}

		const commandCooldowns = this.cooldowns.get(commandName)!;
		const lastUsed = commandCooldowns.get(userId);
		const now = Date.now();

		if (lastUsed && now - lastUsed < cooldownTime) {
			const remaining = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
			return {
				success: true,
				continue: false,
				response: `⏱️ Please wait ${remaining} more seconds before using this command again.`,
			};
		}

		commandCooldowns.set(userId, now);

		// Clean up old entries
		setTimeout(() => {
			commandCooldowns.delete(userId);
		}, cooldownTime);

		return { success: true, continue: true };
	}
}

export class PermissionsMiddleware extends CommandMiddleware {
	name = 'permissions';
	priority = 80;

	async execute(context: MiddlewareContext): Promise<MiddlewareResult> {
		const command = context.command;
		const interaction = context.interaction;

		if (!interaction.inGuild()) {
			return { success: true, continue: true };
		}

		const requiredPermissions = command.data.default_member_permissions as any;
		if (!requiredPermissions) {
			return { success: true, continue: true };
		}

		const member = interaction.member;
		if (!member) {
			return {
				success: true,
				continue: false,
				response: '❌ Unable to verify your permissions.',
			};
		}

		let hasPermission = false;
		try {
			hasPermission = member.permissions.has(requiredPermissions as any);
		} catch (error) {
			logger.error('Permission check failed:', error);
		}
		if (!hasPermission) {
			return {
				success: true,
				continue: false,
				response: "❌ You don't have permission to use this command.",
			};
		}

		return { success: true, continue: true };
	}
}

export class OwnerMiddleware extends CommandMiddleware {
	name = 'owner';
	priority = 70;

	async execute(context: MiddlewareContext): Promise<MiddlewareResult> {
		const commandName = context.command.data.name;

		// Only apply to commands that start with "owner:" or are in owner commands list
		if (
			!commandName.startsWith('owner:') &&
			!this.isOwnerCommand(commandName)
		) {
			return { success: true, continue: true };
		}

		const isOwner = context.client.isOwner(context.interaction.user.id);
		if (!isOwner) {
			return {
				success: true,
				continue: false,
				response: '🚫 This command is only available to the bot owner.',
			};
		}

		return { success: true, continue: true };
	}

	private isOwnerCommand(commandName: string): boolean {
		const ownerCommands = ['eval', 'reload', 'shutdown', 'debug'];
		return ownerCommands.includes(commandName);
	}
}

export class MiddlewareManager {
	private middlewares: CommandMiddleware[] = [];

	constructor() {
		// Register default middlewares
		this.register(new BlacklistMiddleware());
		this.register(new CooldownMiddleware());
		this.register(new PermissionsMiddleware());
		this.register(new OwnerMiddleware());
	}

	register(middleware: CommandMiddleware): void {
		this.middlewares.push(middleware);
		// Sort by priority (higher priority runs first)
		this.middlewares.sort((a, b) => b.priority - a.priority);
	}

	unregister(name: string): boolean {
		const index = this.middlewares.findIndex((m) => m.name === name);
		if (index !== -1) {
			this.middlewares.splice(index, 1);
			return true;
		}
		return false;
	}

	async executeMiddlewares(context: MiddlewareContext): Promise<{
		success: boolean;
		response?: string;
		error?: string;
	}> {
		for (const middleware of this.middlewares) {
			try {
				const result = await middleware.execute(context);

				if (!result.success) {
					return {
						success: false,
						error: result.error,
					};
				}

				if (!result.continue) {
					return {
						success: true,
						response: result.response,
					};
				}
			} catch (error) {
				logger.error(`Middleware ${middleware.name} failed:`, error);
				return {
					success: false,
					error: `Middleware ${middleware.name} failed`,
				};
			}
		}

		return { success: true };
	}
}
