import { pgTable, uniqueIndex, text, integer, jsonb, timestamp, varchar, serial } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const user = pgTable("User", {
	discordId: text("discord_id").notNull(),
	balance: integer().default(0).notNull(),
	backpack: jsonb(),
	level: integer().default(1).notNull(),
	xp: integer().default(0).notNull(),
	achievements: jsonb(),
	badges: jsonb(),
	bank: integer(),
	miningResources: jsonb("mining_resources"),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	lastDaily: timestamp({ precision: 3, mode: 'string' }),
	transactions: jsonb(),
}, (table) => [
	uniqueIndex("User_discord_id_key").using("btree", table.discordId.asc().nullsLast().op("text_ops")),
]);

export const commandStat = pgTable("CommandStat", {
	date: timestamp({ precision: 3, mode: 'string' }).notNull(),
	command: text().notNull(),
	count: integer().default(0).notNull(),
	subcommand: text(),
	id: serial().primaryKey().notNull(),
}, (table) => [
	uniqueIndex("CommandStat_date_command_subcommand_key").using("btree", table.date.asc().nullsLast().op("timestamp_ops"), table.command.asc().nullsLast().op("text_ops"), table.subcommand.asc().nullsLast().op("timestamp_ops")),
]);
