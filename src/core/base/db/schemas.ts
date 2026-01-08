import type { BackpackType, BadgeID, Transaction } from 'app/shared/types.js';
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

export interface UserBadge {
	badge_id: BadgeID;
	acquiredAt?: Date;
}

export interface ConfigsData {
	aboutme: string;
}

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
	configs: jsonb().notNull().default({}).$type<{
		movementLogs?: {
			welcome?: {
				enable: boolean;
				channelId: string;
				message: string;
			};
			leave?: {
				enable: boolean;
				channelId: string;
				message: string;
			};
		};
	}>(),
});

export const blacklist = pgTable('Blacklist', {
	id: serial('id').primaryKey().notNull(),

	targetId: text('target_id').notNull(),
	type: text('type').notNull().$type<'user' | 'guild'>(),

	reason: text('reason'),
	addedBy: text('added_by'),

	createdAt: timestamp({ precision: 3, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});
