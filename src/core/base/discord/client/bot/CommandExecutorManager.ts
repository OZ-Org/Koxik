import type { ChatInputCommandInteraction } from 'discord.js';
import { ReplyBuilder } from './ReplyBuilder.js';
import type { AutocompleteOptions, CommandRunOptions } from './types.js';

export interface CommandContext {
	interaction: ChatInputCommandInteraction;
	reply: ReplyBuilder;
}

export class CommandExecutorManager {
	private runFn?: (options: CommandRunOptions) => Promise<unknown>;
	private autocompleteFn?: (options: AutocompleteOptions) => Promise<unknown>;

	setRunHandler(
		handler: (options: CommandRunOptions) => Promise<unknown>,
	): this {
		this.runFn = handler;
		return this;
	}

	setAutocompleteHandler(
		handler: (options: AutocompleteOptions) => Promise<unknown>,
	): this {
		this.autocompleteFn = handler;
		return this;
	}

	async execute(options: CommandRunOptions): Promise<unknown> {
		if (!this.runFn) {
			throw new Error('No run handler defined for this command');
		}
		return this.runFn(options);
	}

	async executeAutocomplete(options: AutocompleteOptions): Promise<unknown> {
		if (!this.autocompleteFn) {
			throw new Error('No autocomplete handler defined for this command');
		}
		return this.autocompleteFn(options);
	}

	createContext(interaction: ChatInputCommandInteraction): CommandContext {
		return {
			interaction,
			reply: new ReplyBuilder(interaction),
		};
	}
}
