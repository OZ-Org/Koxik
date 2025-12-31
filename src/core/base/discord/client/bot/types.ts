import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	ClientEvents,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { KoxikClient } from './CustomClient.js';

export interface CommandRunOptions {
	client: KoxikClient;
	interaction: ChatInputCommandInteraction;
}

export interface AutocompleteOptions {
	client: KoxikClient;
	interaction: AutocompleteInteraction;
}

/**
 * Interface for creating Discord slash commands.
 *
 * @example
 * // Basic command example
 * import { SlashCommandBuilder } from 'discord.js';
 * import { createCommand } from '@base';
 *
 * export default createCommand({
 *   data: new SlashCommandBuilder()
 *     .setName('ping')
 *     .setDescription('Check bot latency'),
 *   run: async (client, interaction) => {
 *     await interaction.reply(`Pong! ${client.ws.ping}ms`);
 *   },
 * });
 *
 * @example
 * // Command with autocomplete
 * export default createCommand({
 *   data: new SlashCommandBuilder()
 *     .setName('search')
 *     .setDescription('Search for something')
 *     .addStringOption(option =>
 *       option.setName('query')
 *         .setDescription('Search query')
 *         .setAutocomplete(true)
 *         .setRequired(true)
 *     ),
 *   run: async (client, interaction) => {
 *     const query = interaction.options.getString('query', true);
 *     await interaction.reply(`Searching for: ${query}`);
 *   },
 *   autocomplete: async (client, interaction) => {
 *     const focusedValue = interaction.options.getFocused();
 *     const choices = ['option1', 'option2', 'option3'];
 *     const filtered = choices.filter(choice =>
 *       choice.startsWith(focusedValue)
 *     );
 *     await interaction.respond(
 *       filtered.map(choice => ({ name: choice, value: choice }))
 *     );
 *   },
 * });
 */
export interface Command {
	/**
	 * The slash command builder configuration.
	 * Defines the command name, description, options, and localization.
	 */
	data:
		| SlashCommandBuilder
		| SlashCommandSubcommandsOnlyBuilder
		| SlashCommandOptionsOnlyBuilder
		| Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

	/**
	 * The main command execution function.
	 * Called when a user executes the slash command.
	 *
	 * @param options - The command execution options
	 */
	run: (options: CommandRunOptions) => Promise<any>;

	/**
	 * Optional autocomplete handler for command options.
	 * Called when a user types in an autocomplete-enabled option.
	 *
	 * @param options - The autocomplete options
	 */
	autocomplete?: (options: AutocompleteOptions) => Promise<any>;
	cooldown?: number;
}

/**
 * Interface for creating Discord event listeners.
 *
 * @example
 * // Listen to ready event
 * import { createEvent } from '@base';
 *
 * export default createEvent({
 *   name: 'ready',
 *   once: true,
 *   run: (client) => {
 *     console.log(`Bot ${client.user.tag} is ready!`);
 *   },
 * });
 *
 * @example
 * // Listen to message events
 * export default createEvent({
 *   name: 'messageCreate',
 *   run: async (message) => {
 *     if (message.author.bot) return;
 *     console.log(`Message from ${message.author.tag}: ${message.content}`);
 *   },
 * });
 */
export interface Event<T extends keyof ClientEvents = keyof ClientEvents> {
	/**
	 * Unique internal name for this event.
	 * Used for identification, logging and deduplication.
	 *
	 * Example: "ready:set-activity"
	 *          "ready:sync-status"
	 */
	name: string;

	/**
	 * Discord.js event name to listen to.
	 *
	 * Example: "clientReady", "guildCreate"
	 */
	event: T;

	/**
	 * Whether this event should only run once.
	 * If true, the event listener will be removed after the first execution.
	 * @default false
	 */
	once?: boolean;

	/**
	 * The event handler function.
	 * Arguments depend on the Discord event type.
	 */
	run: (...args: ClientEvents[T]) => Promise<void> | void;
}

/**
 * Defines where Discord slash commands should be registered.
 *
 * Commands can be registered either globally (available in all servers) or in specific guilds (servers).
 *
 * @example
 * // Register commands globally (available in all servers where the bot is)
 * import { RegisterType } from '@basedir/discord/client/bot/types.js';
 * import { createBot } from '@basedir/discord/client/KoxikClient.js';
 *
 * export const { createCommand, createEvent } = createBot({
 *   token: process.env.DISCORD_TOKEN as string,
 *   commands: {
 *     registerOn: RegisterType.Global,
 *   },
 * });
 *
 * @example
 * // Register commands in specific guilds (recommended for development/testing)
 * import { RegisterType } from '@basedir/discord/client/bot/types.js';
 * import { createBot } from '@basedir/discord/client/KoxikClient.js';
 *
 * export const { createCommand, createEvent } = createBot({
 *   token: process.env.DISCORD_TOKEN as string,
 *   commands: {
 *     registerOn: RegisterType.Guild([
 *       '1426601171455311973', // Your test server ID
 *       '1399909178495074304', // Another server ID
 *     ]),
 *   },
 * });
 *
 * @remarks
 * - **Global registration**: Commands take up to 1 hour to propagate across all Discord servers
 * - **Guild registration**: Commands are instantly available in the specified servers (recommended for development)
 * - You can switch between Global and Guild registration at any time
 */
export const RegisterType = {
	/**
	 * Register commands globally across all servers where the bot is present.
	 *
	 * @remarks
	 * Global commands can take up to 1 hour to update across Discord's servers.
	 * Use this for production deployments.
	 */
	Global: () =>
		({
			type: 'Global',
		}) as const,

	/**
	 * Register commands only in specific guilds (servers).
	 *
	 * @param guilds - Array of guild IDs where commands should be registered
	 * @returns A RegisterType configuration for guild-specific registration
	 *
	 * @remarks
	 * Guild commands update instantly, making this ideal for development and testing.
	 *
	 * @example
	 * RegisterType.Guild(['1234567890', '0987654321'])
	 */
	Guild: <T extends string[]>(guilds: T) =>
		({
			type: 'Guild',
			guilds,
		}) as const,

	Depends: {
		Global: <Env extends string>(env: Env) =>
			({
				type: 'DependsGlobal',
				env,
			}) as const,

		Guild: <Env extends string>(env: Env, guilds: string[]) =>
			({
				type: 'DependsGuild',
				env,
				guilds,
			}) as const,
	},
};

export type RegisterType =
	| { type: 'Global' }
	| { type: 'Guild'; guilds: string[] }
	| { type: 'DependsGlobal'; env: string }
	| { type: 'DependsGuild'; env: string; guilds: string[] };

export interface RuleRunOptions {
	client: KoxikClient;
	interaction: ChatInputCommandInteraction;
	command: Command;
}

export interface Rule {
	name: string;
	run: (options: RuleRunOptions) => Promise<boolean | undefined>;
}

/**
 * Configuration options for creating the Koxik bot instance.
 *
 * @example
 * // Basic bot setup with guild registration
 * import { RegisterType } from '@basedir/discord/client/bot/types.js';
 * import { createBot } from '@basedir/discord/client/KoxikClient.js';
 *
 * export const { createCommand, createEvent } = createBot({
 *   token: process.env.DISCORD_TOKEN as string,
 *   commands: {
 *     registerOn: RegisterType.Guild(['1234567890']),
 *   },
 *   owner: '1234567890', // Your Discord user ID
 * });
 *
 * @example
 * // Production setup with global registration
 * export const { createCommand, createEvent } = createBot({
 *   token: process.env.DISCORD_TOKEN as string,
 *   commands: {
 *     registerOn: RegisterType.Global,
 *   },
 *   owner: ['1234567890', '0987654321'], // Multiple owners
 * });
 */
export interface BotOptions {
	/**
	 * The Discord bot token from the Developer Portal.
	 *
	 * @remarks
	 * Keep this token secret! Never commit it to version control.
	 * Use environment variables to store it securely.
	 *
	 * @see {@link https://discord.com/developers/applications Discord Developer Portal}
	 */
	token: string;

	/**
	 * Command registration configuration.
	 * Defines where slash commands should be registered.
	 */
	commands?: {
		/**
		 * Where to register slash commands (Global or specific Guilds).
		 *
		 * @remarks
		 * - Use `RegisterType.Guild([...])` for development (instant updates)
		 * - Use `RegisterType.Global` for production (1 hour propagation time)
		 *
		 * @see {@link RegisterType}
		 */
		registerOn: RegisterType | RegisterType[];
	};

	/**
	 * Bot owner Discord user ID(s).
	 * Can be used for owner-only commands or features.
	 *
	 * @remarks
	 * You can find your Discord user ID by enabling Developer Mode in Discord settings,
	 * then right-clicking your profile and selecting "Copy User ID".
	 */
	owner?: string | string[];

	/**
	 * Custom variables to be accessible globally via the client.
	 * Useful for storing configuration, API keys, or other shared state.
	 */
	customVariables?: Record<string, any>;

	/**
	 * Configuration for registering rules.
	 */
	registerRules?: {
		rules: Rule[];
	};
}
