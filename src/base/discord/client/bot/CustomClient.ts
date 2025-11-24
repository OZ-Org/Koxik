import { Client, type ClientOptions, type ClientUser } from 'discord.js';

class SolidAccess {
	constructor(private client: Client) {}

	get user(): ClientUser {
		const user = this.client.user;
		if (!user) throw new Error('client.user não está inicializado ainda!');
		return user;
	}
}

export class KoxikClient extends Client {
	public owners: string[];
	public readonly solid: SolidAccess;

	constructor(options: ClientOptions, owners?: string[]) {
		super(options);
		this.owners = owners ?? [];
		this.solid = new SolidAccess(this);
	}
}
