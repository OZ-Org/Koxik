export interface CacheEntry<T> {
	value: T;
	expiresAt?: number;
}

export interface CacheStats {
	hits: number;
	misses: number;
	size: number;
	hitRate: number;
}

export class CacheManager {
	private cache = new Map<string, CacheEntry<any>>();
	private stats = { hits: 0, misses: 0 };
	private cleanupInterval!: ReturnType<typeof setInterval>;

	constructor(
		private defaultTTL?: number,
		private cleanupIntervalMs = 60000,
		private maxSize = 10000,
	) {
		this.startCleanup();
	}

	set<T>(key: string, value: T, ttl?: number): void {
		if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) this.cache.delete(firstKey);
		}

		const expiresAt =
			ttl || this.defaultTTL
				? Date.now() + (ttl || this.defaultTTL!)
				: undefined;

		this.cache.set(key, { value, expiresAt });
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);

		if (!entry) {
			this.stats.misses++;
			return null;
		}

		if (entry.expiresAt && Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			this.stats.misses++;
			return null;
		}

		this.stats.hits++;
		return entry.value;
	}

	getWithDefault<T>(key: string, defaultValue: T, ttl?: number): T {
		const cached = this.get<T>(key);
		if (cached !== null) {
			return cached;
		}

		this.set(key, defaultValue, ttl);
		return defaultValue;
	}

	has(key: string): boolean {
		const entry = this.cache.get(key);

		if (!entry) return false;

		if (entry.expiresAt && Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return false;
		}

		return true;
	}

	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
		this.stats = { hits: 0, misses: 0 };
	}

	keys(): string[] {
		return Array.from(this.cache.keys());
	}

	size(): number {
		return this.cache.size;
	}

	getStats(): CacheStats {
		const total = this.stats.hits + this.stats.misses;
		const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

		return {
			hits: this.stats.hits,
			misses: this.stats.misses,
			size: this.cache.size,
			hitRate: Math.round(hitRate * 100) / 100,
		};
	}

	private startCleanup(): void {
		this.cleanupInterval = setInterval(() => {
			const now = Date.now();
			const keysToDelete: string[] = [];

			for (const [key, entry] of this.cache.entries()) {
				if (entry.expiresAt && now > entry.expiresAt) {
					keysToDelete.push(key);
				}
			}

			for (const key of keysToDelete) {
				this.cache.delete(key);
			}
		}, this.cleanupIntervalMs);
	}

	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
		this.clear();
	}
}

// Specialized cache instances
export class UserCache<T = unknown> extends CacheManager {
	constructor(ttl = 300000) {
		super(ttl);
	}

	getUser(discordId: string): T | null {
		return this.get<T>(`user:${discordId}`);
	}

	setUser(discordId: string, userData: T, ttl?: number) {
		return this.set(`user:${discordId}`, userData, ttl);
	}

	getUserStats(discordId: string): T | null {
		return this.get<T>(`user_stats:${discordId}`);
	}

	setUserStats(discordId: string, stats: T, ttl?: number) {
		return this.set(`user_stats:${discordId}`, stats, ttl);
	}
}

export class GuildCache<T = unknown> extends CacheManager {
	constructor(ttl = 600000) {
		super(ttl);
	}

	getConfig(guildId: string): T | null {
		return this.get<T>(`guild_config:${guildId}`);
	}

	setConfig(guildId: string, config: T, ttl?: number) {
		return this.set(`guild_config:${guildId}`, config, ttl);
	}

	getSettings(guildId: string): T | null {
		return this.get<T>(`guild_settings:${guildId}`);
	}

	setSettings(guildId: string, settings: T, ttl?: number) {
		return this.set(`guild_settings:${guildId}`, settings, ttl);
	}
}

export class CommandCache<T = unknown> extends CacheManager {
	constructor(ttl = 60000) {
		super(ttl);
	}

	getCooldown(commandName: string, userId: string): T | null {
		return this.get<T>(`cooldown:${commandName}:${userId}`);
	}

	setCooldown(commandName: string, userId: string, ttl?: number) {
		return this.set(
			`cooldown:${commandName}:${userId}`,
			true as unknown as T,
			ttl,
		);
	}

	getPermission(userId: string, guildId: string): T | null {
		return this.get<T>(`permission:${userId}:${guildId}`);
	}

	setPermission(userId: string, guildId: string, permissions: T, ttl?: number) {
		return this.set(`permission:${userId}:${guildId}`, permissions, ttl);
	}
}

// Global cache instance
export const globalCache = new CacheManager();
export const userCache = new UserCache();
export const guildCache = new GuildCache();
export const commandCache = new CommandCache();
