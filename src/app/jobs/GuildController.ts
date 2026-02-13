import { db } from '@db';
import { guilds } from '@schemas';
import { eq } from 'drizzle-orm';

export interface WelcomeLeaveConfig {
	enable: boolean;
	channelId: string;
	message: string;
}

export interface MovementLogsConfig {
	welcome?: WelcomeLeaveConfig;
	leave?: WelcomeLeaveConfig;
}

export interface GuildConfigs {
	movementLogs?: MovementLogsConfig;
}

export class GuildController {
	static async getGuild(guildId: string) {
		try {
			const result = await db
				.select()
				.from(guilds)
				.where(eq(guilds.id, guildId));

			return result[0] || null;
		} catch (error) {
			console.error('Error getting guild:', error);
			return null;
		}
	}

	static async getConfigs(guildId: string): Promise<GuildConfigs | null> {
		try {
			const guild = await GuildController.getGuild(guildId);
			return guild?.configs || null;
		} catch (error) {
			console.error('Error getting guild configs:', error);
			return null;
		}
	}

	static async updateConfigs(
		guildId: string,
		configs: Partial<GuildConfigs>,
	): Promise<boolean> {
		try {
			const currentConfigs = await GuildController.getConfigs(guildId);

			if (currentConfigs === null) {
				return false;
			}

			const updatedConfigs = {
				...currentConfigs,
				...configs,
			};

			await db
				.update(guilds)
				.set({ configs: updatedConfigs })
				.where(eq(guilds.id, guildId));

			return true;
		} catch (error) {
			console.error('Error updating guild configs:', error);
			return false;
		}
	}

	static async getMovementLogs(
		guildId: string,
	): Promise<MovementLogsConfig | null> {
		const configs = await GuildController.getConfigs(guildId);
		return configs?.movementLogs || null;
	}

	static async setMovementLog(
		guildId: string,
		type: 'welcome' | 'leave',
		config: Partial<WelcomeLeaveConfig>,
	): Promise<boolean> {
		try {
			const guild = await GuildController.getGuild(guildId);
			if (!guild) {
				console.error(`Guild ${guildId} not found in database`);
				return false;
			}

			const movementLogs =
				(await GuildController.getMovementLogs(guildId)) || {};

			const existingConfig = movementLogs[type] || {
				enable: false,
				channelId: '',
				message: '',
			};

			const updatedMovementLogs = {
				...movementLogs,
				[type]: {
					enable: config.enable ?? existingConfig.enable,
					channelId: config.channelId ?? existingConfig.channelId,
					message: config.message ?? existingConfig.message,
				},
			};

			const result = await GuildController.updateConfigs(guildId, {
				movementLogs: updatedMovementLogs,
			});

			if (!result) {
				console.error(`Failed to update movement logs for guild ${guildId}`);
				return false;
			}

			return true;
		} catch (error) {
			console.error('Error setting movement log:', error);
			return false;
		}
	}

	static async toggleMovementLog(
		guildId: string,
		type: 'welcome' | 'leave',
		enable: boolean,
	): Promise<boolean> {
		return await GuildController.setMovementLog(guildId, type, { enable });
	}

	static async isWelcomeEnabled(guildId: string): Promise<boolean> {
		const movementLogs = await GuildController.getMovementLogs(guildId);
		return movementLogs?.welcome?.enable ?? false;
	}

	static async isLeaveEnabled(guildId: string): Promise<boolean> {
		const movementLogs = await GuildController.getMovementLogs(guildId);
		return movementLogs?.leave?.enable ?? false;
	}

	static formatMessage(
		message: string,
		userId: string,
		guildName: string,
	): string {
		return message
			.replace('{user}', `<@${userId}>`)
			.replace('{server.name}', guildName)
			.replace('{guild.name}', guildName);
	}

	static async getWelcomeConfig(
		guildId: string,
	): Promise<WelcomeLeaveConfig | null> {
		const movementLogs = await GuildController.getMovementLogs(guildId);
		return movementLogs?.welcome || null;
	}

	static async getLeaveConfig(
		guildId: string,
	): Promise<WelcomeLeaveConfig | null> {
		const movementLogs = await GuildController.getMovementLogs(guildId);
		return movementLogs?.leave || null;
	}
}
