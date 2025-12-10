import { Client, type ClientOptions, type ClientUser } from 'discord.js';

class SolidAccess {
	constructor(private client: Client) {}

	get user(): ClientUser {
		const user = this.client.user;
		if (!user) throw new Error('client.user não está inicializado ainda!');
		return user;
	}

	get uptime(): number {
		const number = this.client.uptime;
		if (!number) throw new Error('client.user não está inicializado ainda!');
		return number;
	}
}

export class KoxikClient extends Client {
	public owners: string[];
	public readonly solid: SolidAccess;

	public customVariables: Record<string, any>;

	constructor(
		options: ClientOptions,
		owners?: string[],
		customVariables?: Record<string, any>,
	) {
		super(options);
		this.owners = owners ?? [];
		this.solid = new SolidAccess(this);
		this.customVariables = customVariables ?? {};
	}
}
