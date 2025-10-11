import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	ClientEvents,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export interface Command {
	data:
		| SlashCommandBuilder
		| SlashCommandSubcommandsOnlyBuilder
		| SlashCommandOptionsOnlyBuilder;
	run: (
		client: Client,
		interaction: ChatInputCommandInteraction,
	) => Promise<any>;
	autocomplete?: (
		client: Client,
		interaction: AutocompleteInteraction,
	) => Promise<any>;
}

export interface Event<T extends keyof ClientEvents = keyof ClientEvents> {
	name: T;
	once?: boolean;
	run: (...args: ClientEvents[T]) => Promise<void> | void;
}

export interface BotOptions {
	token: string;
	commands?: {
		registerOn: 'global' | string;
	};
}
