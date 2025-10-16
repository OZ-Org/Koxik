import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	ClientEvents,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { KoxikClient } from './CustomClient.js';
export interface Command {
	data:
		| SlashCommandBuilder
		| SlashCommandSubcommandsOnlyBuilder
		| SlashCommandOptionsOnlyBuilder;
	run: (
		client: KoxikClient,
		interaction: ChatInputCommandInteraction,
	) => Promise<any>;
	autocomplete?: (
		client: KoxikClient,
		interaction: AutocompleteInteraction,
	) => Promise<any>;
}

export interface Event<T extends keyof ClientEvents = keyof ClientEvents> {
	name: T;
	once?: boolean;
	run: (...args: ClientEvents[T]) => Promise<void> | void;
}

export const RegisterType = {
	Global: { type: 'Global' } as const,
	Guild: <T extends string[]>(guilds: T) =>
		({ type: 'Guild', guilds }) as const,
};

export type RegisterType =
	| typeof RegisterType.Global
	| ReturnType<typeof RegisterType.Guild>;

export interface BotOptions {
	token: string;
	commands?: {
		registerOn: RegisterType;
	};
	owner?: string | string[];
}
