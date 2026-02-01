import type { BackpackType, Transaction } from 'app/shared/types.js';
import { sql } from 'drizzle-orm';
import {
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const UserBadgeSchema = z.object({
	badge_id: z.string(),
	acquiredAt: z.date().optional(),
});

export const ConfigsDataSchema = z.object({
	aboutme: z.string().max(500),
});

export const GuildConfigsSchema = z.object({
	movementLogs: z
		.object({
			welcome: z
				.object({
					enable: z.boolean(),
					channelId: z.string(),
					message: z.string(),
				})
				.optional(),
			leave: z
				.object({
					enable: z.boolean(),
					channelId: z.string(),
					message: z.string(),
				})
				.optional(),
		})
		.optional(),
});

export interface UserBadge extends z.infer<typeof UserBadgeSchema> {}
export interface ConfigsData extends z.infer<typeof ConfigsDataSchema> {}

export const user = pgTable(
	'User',
	{
		discordId: text('discord_id').notNull(),
		balance: integer().default(0).notNull(),
		backpack: jsonb().$type<BackpackType>(),
		level: integer().default(1).notNull(),
		xp: integer().default(0).notNull(),
		achievements: jsonb(),
		badges: jsonb().$type<UserBadge[]>(),
		bank: integer(),
		configs: jsonb('configs').$type<ConfigsData>(),
		miningResources: jsonb('mining_resources'),
		createdAt: timestamp({ precision: 3, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		lastDaily: timestamp({ precision: 3, mode: 'string' }),
		datingWith: text('datingWith'),
		marriedWith: text('marriedWith'),
		transactions: jsonb().$type<Transaction[]>(),
	},
	(table) => [
		uniqueIndex('User_discord_id_key').using(
			'btree',
			table.discordId.asc().nullsLast().op('text_ops'),
		),
	],
);

export const commandStat = pgTable(
	'CommandStat',
	{
		date: timestamp({ precision: 3, mode: 'string' }).notNull(),
		command: text().notNull(),
		count: integer().default(0).notNull(),
		subcommand: text().notNull(),
		id: serial().primaryKey().notNull(),
	},
	(table) => [
		uniqueIndex('CommandStat_date_command_subcommand_key').using(
			'btree',
			table.date.asc().nullsLast().op('timestamp_ops'),
			table.command.asc().nullsLast().op('text_ops'),
			table.subcommand.asc().nullsLast().op('text_ops'),
		),
	],
);

export const guilds = pgTable('Guild', {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	ownerId: text().notNull(),
	inputsOn: timestamp({ precision: 3, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	configs: jsonb()
		.notNull()
		.default({})
		.$type<z.infer<typeof GuildConfigsSchema>>(),
});

export const BlacklistTypeSchema = z.enum(['user', 'guild']);
export type BlacklistType = z.infer<typeof BlacklistTypeSchema>;

export const BlacklistSchema = z.object({
	targetId: z.string(),
	type: BlacklistTypeSchema,
	reason: z.string().optional(),
	addedBy: z.string().optional(),
});

export const blacklist = pgTable('Blacklist', {
	id: serial('id').primaryKey().notNull(),

	targetId: text('target_id').notNull(),
	type: text('type').notNull().$type<BlacklistType>(),

	reason: text('reason'),
	addedBy: text('added_by'),

	createdAt: timestamp({ precision: 3, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});
