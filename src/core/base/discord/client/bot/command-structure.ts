import {
	ApplicationCommandOptionType,
	type InteractionContextType,
	type PermissionResolvable,
	PermissionsBitField,
	SlashCommandBuilder,
	type SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
	type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type {
	AutocompleteOptions,
	Command,
	CommandRunOptions,
} from './types.js';

// ==================== TYPES ====================

export type CommandOptionChoice = {
	name: string;
	value: string | number;
	name_localizations?: Record<string, string | null>;
};

export interface CommandOption {
	name: string;
	description: string;
	name_localizations?: Record<string, string | null>;
	description_localizations?: Record<string, string | null>;
	type: ApplicationCommandOptionType;
	required?: boolean;
	choices?: CommandOptionChoice[];
	autocomplete?: boolean;
	channel_types?: number[];
	min_value?: number;
	max_value?: number;
	min_length?: number;
	max_length?: number;
}

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

// Config format with direct properties (new format)
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

// Legacy format with data property (old format)
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

// Union type that accepts both formats
export type CommandInput = CommandConfig | LegacyCommandConfig;

// ==================== BUILDER HELPER ====================

function buildOptions(builder: any, options?: CommandOption[]) {
	if (!options) return;

	for (const opt of options) {
		const applyBasic = (o: any) => {
			o.setName(opt.name)
				.setDescription(opt.description)
				.setRequired(!!opt.required);

			if (opt.name_localizations)
				o.setNameLocalizations(opt.name_localizations);
			if (opt.description_localizations)
				o.setDescriptionLocalizations(opt.description_localizations);
			if (opt.autocomplete) o.setAutocomplete(true);
			if (opt.choices) o.addChoices(...opt.choices);
			return o;
		};

		switch (opt.type) {
			case ApplicationCommandOptionType.String:
				builder.addStringOption((o: any) => {
					applyBasic(o);
					if (opt.min_length) o.setMinLength(opt.min_length);
					if (opt.max_length) o.setMaxLength(opt.max_length);
					return o;
				});
				break;
			case ApplicationCommandOptionType.Integer:
				builder.addIntegerOption((o: any) => {
					applyBasic(o);
					if (opt.min_value) o.setMinValue(opt.min_value);
					if (opt.max_value) o.setMaxValue(opt.max_value);
					return o;
				});
				break;
			case ApplicationCommandOptionType.Number:
				builder.addNumberOption((o: any) => {
					applyBasic(o);
					if (opt.min_value) o.setMinValue(opt.min_value);
					if (opt.max_value) o.setMaxValue(opt.max_value);
					return o;
				});
				break;
			case ApplicationCommandOptionType.Boolean:
				builder.addBooleanOption((o: any) => applyBasic(o));
				break;
			case ApplicationCommandOptionType.User:
				builder.addUserOption((o: any) => applyBasic(o));
				break;
			case ApplicationCommandOptionType.Role:
				builder.addRoleOption((o: any) => applyBasic(o));
				break;
			case ApplicationCommandOptionType.Channel:
				builder.addChannelOption((o: any) => {
					applyBasic(o);
					if (opt.channel_types) o.addChannelTypes(...opt.channel_types);
					return o;
				});
				break;
			case ApplicationCommandOptionType.Mentionable:
				builder.addMentionableOption((o: any) => applyBasic(o));
				break;
			case ApplicationCommandOptionType.Attachment:
				builder.addAttachmentOption((o: any) => applyBasic(o));
				break;
		}
	}
}

// ==================== CLASS ====================

export class CommandBuilder implements Command {
	public data:
		| SlashCommandBuilder
		| SlashCommandSubcommandsOnlyBuilder
		| SlashCommandOptionsOnlyBuilder
		| Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
	private runHandlers = new Map<string, Function>();
	private autocompleteHandlers = new Map<string, Function>();
	private subcommandConfigs = new Map<string, SubCommand>();
	private cooldowns = new Map<string, number>();
	private config: CommandConfig;
	private legacyRun?: (options: CommandRunOptions) => Promise<any>;
	private legacyAutocomplete?: (options: AutocompleteOptions) => Promise<any>;

	constructor(input: CommandInput) {
		// Check if it's legacy format (has 'data' property)
		if ('data' in input) {
			// Legacy format
			this.data = input.data;
			this.legacyRun = input.run;
			this.legacyAutocomplete = input.autocomplete;

			// Create a minimal config for compatibility
			this.config = {
				name: this.data.name,
				description: this.data.description,
				baseCommand: false,
				cooldown: input.cooldown,
			};
		} else {
			// New format
			const config = input as CommandConfig;
			this.config = config;
			this.data = new SlashCommandBuilder()
				.setName(config.name)
				.setDescription(config.description);

			if (config.name_localizations)
				this.data.setNameLocalizations(config.name_localizations);
			if (config.description_localizations)
				this.data.setDescriptionLocalizations(config.description_localizations);
			if (config.default_member_permissions)
				this.data.setDefaultMemberPermissions(
					PermissionsBitField.resolve(config.default_member_permissions),
				);
			if (config.contexts) this.data.setContexts(...config.contexts);
			if (config.nsfw) this.data.setNSFW(config.nsfw);

			// Se não for baseCommand, adiciona opções normais
			if (!config.baseCommand && config.options) {
				buildOptions(this.data, config.options);
			}
		}
	}

	public addSubCommands(subcommands: SubCommand[]) {
		for (const sub of subcommands) {
			const subBuilder = new SlashCommandSubcommandBuilder()
				.setName(sub.name)
				.setDescription(sub.description);

			if (sub.name_localizations)
				subBuilder.setNameLocalizations(sub.name_localizations);
			if (sub.description_localizations)
				subBuilder.setDescriptionLocalizations(sub.description_localizations);

			buildOptions(subBuilder, sub.options);
			// Type assertion: when adding subcommands, this.data must be a builder that supports them
			(
				this.data as SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder
			).addSubcommand(subBuilder);

			this.runHandlers.set(sub.name, sub.run);
			this.subcommandConfigs.set(sub.name, sub);
			if (sub.autocomplete) {
				this.autocompleteHandlers.set(sub.name, sub.autocomplete);
			}
		}
		return this;
	}

	public addSubCommandGroup(
		config: SubCommandGroupConfig,
		subcommands: SubCommand[],
	) {
		const groupBuilder = new SlashCommandSubcommandGroupBuilder()
			.setName(config.name)
			.setDescription(config.description);

		if (config.name_localizations)
			groupBuilder.setNameLocalizations(config.name_localizations);
		if (config.description_localizations)
			groupBuilder.setDescriptionLocalizations(
				config.description_localizations,
			);

		for (const sub of subcommands) {
			const subBuilder = new SlashCommandSubcommandBuilder()
				.setName(sub.name)
				.setDescription(sub.description);

			if (sub.name_localizations)
				subBuilder.setNameLocalizations(sub.name_localizations);
			if (sub.description_localizations)
				subBuilder.setDescriptionLocalizations(sub.description_localizations);

			buildOptions(subBuilder, sub.options);
			groupBuilder.addSubcommand(subBuilder);

			this.runHandlers.set(`${config.name}.${sub.name}`, sub.run);
			this.subcommandConfigs.set(`${config.name}.${sub.name}`, sub);
			if (sub.autocomplete) {
				this.autocompleteHandlers.set(
					`${config.name}.${sub.name}`,
					sub.autocomplete,
				);
			}
		}
		// Type assertion: when adding subcommand groups, this.data must be a builder that supports them
		(
			this.data as SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder
		).addSubcommandGroup(groupBuilder);
		return this;
	}

	public async run({ client, interaction }: CommandRunOptions) {
		const subcommand = interaction.options.getSubcommand(false);
		const group = interaction.options.getSubcommandGroup(false);

		if (group && subcommand) {
			const key = `${group}.${subcommand}`;
			const subConfig = this.subcommandConfigs.get(key);
			const handler = this.runHandlers.get(key);
			if (handler) {
				if (
					await this.handleCooldown(
						interaction,
						key,
						subConfig?.cooldown ?? this.config.cooldown ?? 0,
					)
				)
					return;
				return handler({ client, interaction });
			}
		} else if (subcommand) {
			const key = subcommand;
			const subConfig = this.subcommandConfigs.get(key);
			const handler = this.runHandlers.get(key);
			if (handler) {
				if (
					await this.handleCooldown(
						interaction,
						key,
						subConfig?.cooldown ?? this.config.cooldown ?? 0,
					)
				)
					return;
				return handler({ client, interaction });
			}
		}

		// Use legacy run if available, otherwise use config.run
		if (this.legacyRun) {
			if (
				await this.handleCooldown(
					interaction,
					'default',
					this.config.cooldown || 0,
				)
			)
				return;
			return this.legacyRun({ client, interaction });
		}

		if (this.config.run && !this.config.baseCommand) {
			if (
				await this.handleCooldown(
					interaction,
					'default',
					this.config.cooldown || 0,
				)
			)
				return;
			return this.config.run({ client, interaction });
		}
	}

	private async handleCooldown(
		interaction: any,
		key: string,
		duration: number,
	): Promise<boolean> {
		if (!duration) return false;

		const userId = interaction.user.id;
		const cooldownKey = `${userId}-${key}`;
		const now = Date.now();
		const expiration = this.cooldowns.get(cooldownKey);

		if (expiration && now < expiration) {
			const remaining = (expiration - now) / 1000;
			await interaction.reply({
				content: `You are on cooldown. Try again in ${remaining.toFixed(1)} seconds.`,
				ephemeral: true,
			});
			return true;
		}

		this.cooldowns.set(cooldownKey, now + duration * 1000);
		setTimeout(() => this.cooldowns.delete(cooldownKey), duration * 1000);
		return false;
	}

	public async autocomplete({ client, interaction }: AutocompleteOptions) {
		const subcommand = interaction.options.getSubcommand(false);
		const group = interaction.options.getSubcommandGroup(false);

		if (group && subcommand) {
			const handler = this.autocompleteHandlers.get(`${group}.${subcommand}`);
			if (handler) return handler({ client, interaction });
		} else if (subcommand) {
			const handler = this.autocompleteHandlers.get(subcommand);
			if (handler) return handler({ client, interaction });
		}

		// Use legacy autocomplete if available, otherwise use config.autocomplete
		if (this.legacyAutocomplete) {
			return this.legacyAutocomplete({ client, interaction });
		}

		if (this.config.autocomplete && !this.config.baseCommand) {
			return this.config.autocomplete({ client, interaction });
		}
	}

	public get cooldown(): number | undefined {
		return this.config.cooldown;
	}
}

// ==================== EXPORTS ====================

export function createCommand(input: CommandInput) {
	return new CommandBuilder(input);
}

export function createSubCommand(config: SubCommand) {
	return config;
}

export function createSubCommandGroup(
	config: SubCommandGroupConfig,
	subcommands: SubCommand[],
) {
	return { config, subcommands };
}
