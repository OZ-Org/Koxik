import { db } from '@db';
import { type ConfigsData, user } from '@schemas';
import type {
	BackpackItem,
	BackpackType,
	Transaction,
} from 'app/shared/types.js';
import { eq, sql } from 'drizzle-orm';

export class UserController {
	/**
	 * Get a user by their Discord ID. Creates the user if they don't exist.
	 * @param discordId The user's Discord ID
	 */
	static async get(discordId: string) {
		let userResult = await db.query.user.findFirst({
			where: eq(user.discordId, discordId),
		});

		if (!userResult) {
			[userResult] = await db
				.insert(user)
				.values({
					discordId,
					balance: 0,
					level: 1,
					xp: 0,
					backpack: [],
					transactions: [],
					achievements: [],
					badges: [],
					miningResources: {},
				})
				.returning();
		}

		return userResult;
	}

	static async find(discordId: string) {
		return await db.query.user.findFirst({
			where: eq(user.discordId, discordId),
		});
	}

	/**
	 * Check if a user exists
	 * @param discordId The user's Discord ID
	 */
	static async exists(discordId: string) {
		const userResult = await db.query.user.findFirst({
			where: eq(user.discordId, discordId),
		});
		return !!userResult;
	}

	/**
	 * Create a user if they don't exist
	 * @param discordId The user's Discord ID
	 */
	static async create(discordId: string) {
		if (await UserController.exists(discordId)) {
			return { success: false, alreadyExists: true };
		}

		const newUser = await UserController.get(discordId); // get() creates if not exists
		return { success: true, user: newUser };
	}

	/**
	 * Update a user's data
	 * @param discordId The user's Discord ID
	 * @param data The data to update
	 */
	static async update(
		discordId: string,
		data: Partial<typeof user.$inferInsert>,
	) {
		const [updatedUser] = await db
			.update(user)
			.set(data)
			.where(eq(user.discordId, discordId))
			.returning();
		return updatedUser;
	}

	/**
	 * Add balance to a user
	 * @param discordId The user's Discord ID
	 * @param amount The amount to add
	 */
	static async addBalance(discordId: string, amount: number) {
		await UserController.get(discordId); // Ensure user exists

		const [updatedUser] = await db
			.update(user)
			.set({
				balance: sql`${user.balance} + ${amount}`,
			})
			.where(eq(user.discordId, discordId))
			.returning();

		return updatedUser;
	}

	/**
	 * Remove balance from a user. Returns false if insufficient funds.
	 * @param discordId The user's Discord ID
	 * @param amount The amount to remove
	 */
	static async removeBalance(discordId: string, amount: number) {
		const userData = await UserController.get(discordId);

		if (userData.balance < amount) {
			return false;
		}

		const [updatedUser] = await db
			.update(user)
			.set({
				balance: sql`${user.balance} - ${amount}`,
			})
			.where(eq(user.discordId, discordId))
			.returning();

		return updatedUser;
	}

	/**
	 * Add XP to a user and handle level up
	 * @param discordId The user's Discord ID
	 * @param amount The amount of XP to add
	 */
	static async addXp(discordId: string, amount: number) {
		const userData = await UserController.get(discordId);

		// Simple level up logic: Level * 100 XP required for next level
		const xpNeeded = userData.level * 100;
		let newXp = userData.xp + amount;
		let newLevel = userData.level;

		if (newXp >= xpNeeded) {
			newXp -= xpNeeded;
			newLevel++;
			// You could trigger a level up event here or return a flag
		}

		const [updatedUser] = await db
			.update(user)
			.set({
				xp: newXp,
				level: newLevel,
			})
			.where(eq(user.discordId, discordId))
			.returning();

		return { user: updatedUser, leveledUp: newLevel > userData.level };
	}

	/**
	 * Add a transaction to the user's history
	 * @param discordId The user's Discord ID
	 * @param transaction The transaction object
	 */
	static async addTransaction(discordId: string, transaction: Transaction) {
		const userData = await UserController.get(discordId);
		const currentTransactions = (userData.transactions as Transaction[]) || [];

		const [updatedUser] = await db
			.update(user)
			.set({
				transactions: [...currentTransactions, transaction],
			})
			.where(eq(user.discordId, discordId))
			.returning();

		return updatedUser;
	}

	/**
	 * Get the user's backpack
	 * @param discordId The user's Discord ID
	 */
	static async getBackpack(discordId: string): Promise<BackpackType> {
		const userData = await UserController.get(discordId);
		return (userData.backpack as BackpackType) || [];
	}

	/**
	 * Add an item to the user's backpack
	 * @param discordId The user's Discord ID
	 * @param item The item to add
	 */
	static async addItemToBackpack(discordId: string, item: BackpackItem) {
		const userData = await UserController.get(discordId);
		const currentBackpack = (userData.backpack as BackpackType) || [];

		const [updatedUser] = await db
			.update(user)
			.set({
				backpack: [...currentBackpack, item],
			})
			.where(eq(user.discordId, discordId))
			.returning();

		return updatedUser;
	}

	/**
	 * Update an item in the backpack (e.g. durability)
	 * @param discordId The user's Discord ID
	 * @param itemId The ID of the item to update
	 * @param updateFn Function to update the item
	 */
	static async updateBackpackItem(
		discordId: string,
		itemId: string,
		updateFn: (item: BackpackItem) => BackpackItem,
	) {
		const userData = await UserController.get(discordId);
		const currentBackpack = (userData.backpack as BackpackType) || [];

		const newBackpack = currentBackpack.map((item) => {
			if ('id' in item && item.id === itemId) {
				return updateFn(item);
			}
			return item;
		});

		const [updatedUser] = await db
			.update(user)
			.set({
				backpack: newBackpack,
			})
			.where(eq(user.discordId, discordId))
			.returning();

		return updatedUser;
	}

	/**
	 * Get the leaderboard of users by balance
	 * @param limit The number of users to return
	 */
	static async getLeaderboard(limit = 10) {
		return await db.query.user.findMany({
			orderBy: (users, { desc }) => [desc(users.balance)],
			limit,
			columns: {
				discordId: true,
				balance: true,
			},
		});
	}

	/**
	 * Get user configs
	 */
	static async getConfigs(discordId: string): Promise<ConfigsData> {
		const userData = await UserController.get(discordId);
		return (userData.configs as ConfigsData) || { aboutme: '' };
	}

	/**
	 * Update user configs
	 */
	static async updateConfigs(
		discordId: string,
		newConfigs: Partial<ConfigsData>,
	) {
		const userData = await UserController.get(discordId);
		const currentConfigs = (userData.configs as ConfigsData) || {};

		const updatedConfigs = { ...currentConfigs, ...newConfigs };

		const [updatedUser] = await db
			.update(user)
			.set({ configs: updatedConfigs })
			.where(eq(user.discordId, discordId))
			.returning();

		return updatedUser;
	}
}
