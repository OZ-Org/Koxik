import { Client, type ClientOptions, type ClientUser } from 'discord.js';

export class ClientNotReadyError extends Error {
	constructor(property: string) {
		super(
			`Client property '${property}' is not available yet - client not ready`,
		);
		this.name = 'ClientNotReadyError';
	}
}

interface CustomVariables {
	[key: string]: unknown;
}

class SolidAccess {
	constructor(private client: Client) {}

	get user(): ClientUser {
		const user = this.client.user;
		if (!user) throw new ClientNotReadyError('user');
		return user;
	}

	get uptime(): number {
		const number = this.client.uptime;
		if (!number) throw new ClientNotReadyError('uptime');
		return number;
	}
}

export class KoxikClient extends Client {
	public owners: readonly string[];
	public readonly solid: SolidAccess;
	public customVariables: CustomVariables;

	constructor(
		options: ClientOptions,
		owners?: readonly string[],
		customVariables?: CustomVariables,
	) {
		super(options);
		this.owners = owners ?? [];
		this.solid = new SolidAccess(this);
		this.customVariables = customVariables ?? {};
	}

	setCustomVariable<T>(key: string, value: T): void {
		this.customVariables[key] = value;
	}

	getCustomVariable<T>(key: string): T | undefined {
		return this.customVariables[key] as T | undefined;
	}

	hasCustomVariable(key: string): boolean {
		return key in this.customVariables;
	}

	removeCustomVariable(key: string): boolean {
		if (key in this.customVariables) {
			delete this.customVariables[key];
			return true;
		}
		return false;
	}

	isOwner(userId: string): boolean {
		return this.owners.includes(userId);
	}
}
