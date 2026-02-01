import {
	type ApplicationCommandOptionType,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
} from 'discord.js';

export type CommandOptionChoice = {
	name: string;
	value: string;
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

export class CommandDefinitionBuilder {
	private builder: SlashCommandBuilder;

	constructor(name: string, description: string) {
		this.builder = new SlashCommandBuilder()
			.setName(name)
			.setDescription(description);
	}

	setNameLocalizations(localizations: Record<string, string | null>): this {
		this.builder.setNameLocalizations(localizations);
		return this;
	}

	setDescriptionLocalizations(
		localizations: Record<string, string | null>,
	): this {
		this.builder.setDescriptionLocalizations(localizations);
		return this;
	}

	setDefaultMemberPermissions(permissions: bigint | string): this {
		this.builder.setDefaultMemberPermissions(permissions);
		return this;
	}

	setDMPermission(enabled: boolean): this {
		this.builder.setDMPermission(enabled);
		return this;
	}

	setNSFW(enabled: boolean): this {
		this.builder.setNSFW(enabled);
		return this;
	}

	addStringOption(
		name: string,
		description: string,
		required = false,
		choices?: CommandOptionChoice[],
	): this {
		this.builder.addStringOption((option) => {
			const opt = option
				.setName(name)
				.setDescription(description)
				.setRequired(required);
			if (choices && choices.length > 0) {
				opt.setChoices(
					...choices.map((c) => ({ name: c.name, value: String(c.value) })),
				);
			}
			return opt;
		});
		return this;
	}

	addIntegerOption(
		name: string,
		description: string,
		required = false,
		minValue?: number,
		maxValue?: number,
	): this {
		this.builder.addIntegerOption((option) => {
			const opt = option
				.setName(name)
				.setDescription(description)
				.setRequired(required);
			if (minValue !== undefined) opt.setMinValue(minValue);
			if (maxValue !== undefined) opt.setMaxValue(maxValue);
			return opt;
		});
		return this;
	}

	addBooleanOption(name: string, description: string, required = false): this {
		this.builder.addBooleanOption((option) =>
			option.setName(name).setDescription(description).setRequired(required),
		);
		return this;
	}

	addUserOption(name: string, description: string, required = false): this {
		this.builder.addUserOption((option) =>
			option.setName(name).setDescription(description).setRequired(required),
		);
		return this;
	}

	addChannelOption(
		name: string,
		description: string,
		required = false,
		channelTypes?: number[],
	): this {
		this.builder.addChannelOption((option) =>
			option
				.setName(name)
				.setDescription(description)
				.setRequired(required)
				.addChannelTypes(...(channelTypes || [])),
		);
		return this;
	}

	addRoleOption(name: string, description: string, required = false): this {
		this.builder.addRoleOption((option) =>
			option.setName(name).setDescription(description).setRequired(required),
		);
		return this;
	}

	addSubcommand(
		name: string,
		description: string,
		builder?: (subcommand: SlashCommandSubcommandBuilder) => void,
	): this {
		const subcommand = new SlashCommandSubcommandBuilder()
			.setName(name)
			.setDescription(description);

		if (builder) {
			builder(subcommand);
		}

		this.builder.addSubcommand(subcommand);
		return this;
	}

	addSubcommandGroup(
		name: string,
		description: string,
		builder?: (group: SlashCommandSubcommandGroupBuilder) => void,
	): this {
		const group = new SlashCommandSubcommandGroupBuilder()
			.setName(name)
			.setDescription(description);

		if (builder) {
			builder(group);
		}

		this.builder.addSubcommandGroup(group);
		return this;
	}

	build(): SlashCommandBuilder {
		return this.builder;
	}
}
