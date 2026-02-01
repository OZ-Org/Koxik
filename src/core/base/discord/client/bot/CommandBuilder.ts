import type {
	InteractionContextType,
	PermissionResolvable,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { CommandOption } from './CommandDefinitionBuilder.js';
import type { AutocompleteOptions, CommandRunOptions } from './types.js';

export interface SubCommand {
	name: string;
	description: string;
	name_localizations?: Record<string, string | null>;
	description_localizations?: Record<string, string | null>;
	default_member_permissions?: PermissionResolvable[];
	options?: CommandOption[];
	run: (options: CommandRunOptions) => Promise<any>;
	autocomplete?: (options: AutocompleteOptions) => Promise<any>;
	cooldown?: number;
}

export interface SubCommandGroupConfig {
	name: string;
	description: string;
	name_localizations?: Record<string, string | null>;
	description_localizations?: Record<string, string | null>;
	default_member_permissions?: PermissionResolvable[];
}

export interface SubCommandGroup {
	config: SubCommandGroupConfig;
	subcommands: SubCommand[];
}

export interface CommandConfig {
	name: string;
	description: string;
	name_localizations?: Record<string, string | null>;
	description_localizations?: Record<string, string | null>;
	baseCommand?: boolean;
	default_member_permissions?: PermissionResolvable[];
	contexts?: InteractionContextType[];
	nsfw?: boolean;
	options?: CommandOption[];
	run?: (options: CommandRunOptions) => Promise<any>;
	autocomplete?: (options: AutocompleteOptions) => Promise<any>;
	cooldown?: number;
}

export interface LegacyCommandConfig {
	data:
		| SlashCommandBuilder
		| SlashCommandSubcommandsOnlyBuilder
		| SlashCommandOptionsOnlyBuilder
		| Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
	run: (options: CommandRunOptions) => Promise<any>;
	autocomplete?: (options: AutocompleteOptions) => Promise<any>;
	cooldown?: number;
}

export class CommandBuilder {
	private config: CommandConfig;
	private subcommands: SubCommand[] = [];
	private subcommandGroups: SubCommandGroup[] = [];

	constructor(name: string, description: string) {
		this.config = {
			name,
			description,
		};
	}

	setNameLocalizations(localizations: Record<string, string | null>): this {
		this.config.name_localizations = localizations;
		return this;
	}

	setDescriptionLocalizations(
		localizations: Record<string, string | null>,
	): this {
		this.config.description_localizations = localizations;
		return this;
	}

	setDefaultMemberPermissions(permissions: PermissionResolvable[]): this {
		this.config.default_member_permissions = permissions;
		return this;
	}

	setContexts(contexts: InteractionContextType[]): this {
		this.config.contexts = contexts;
		return this;
	}

	setNSFW(nsfw = true): this {
		this.config.nsfw = nsfw;
		return this;
	}

	setCooldown(cooldown: number): this {
		this.config.cooldown = cooldown;
		return this;
	}

	setRunHandler(handler: (options: CommandRunOptions) => Promise<any>): this {
		this.config.run = handler;
		return this;
	}

	setAutocompleteHandler(
		handler: (options: AutocompleteOptions) => Promise<any>,
	): this {
		this.config.autocomplete = handler;
		return this;
	}

	addSubcommand(subcommand: SubCommand): this {
		this.subcommands.push(subcommand);
		return this;
	}

	addSubcommandGroup(group: SubCommandGroup): this {
		this.subcommandGroups.push(group);
		return this;
	}

	build(): CommandConfig {
		return {
			...this.config,
		};
	}

	getSubcommands(): SubCommand[] {
		return this.subcommands;
	}

	getSubcommandGroups(): SubCommandGroup[] {
		return this.subcommandGroups;
	}
}
