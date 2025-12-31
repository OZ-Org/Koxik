import { createEvent } from '@base';
import { db } from '@db';
import { blacklist, guilds } from '@schemas';
import { eq } from 'drizzle-orm';

export default createEvent({
	name: 'add:guild:database',
	event: 'guildCreate',
	once: false,
	run: async (guild) => {
		const ownerID = guild.ownerId;
		const guildID = guild.id;

		const guildBlacklisted = await db
			.select()
			.from(blacklist)
			.where(eq(blacklist.targetId, guildID))
			.then((rows) => rows.find((r) => r.type === 'guild'));

		if (guildBlacklisted) {
			await guild.leave().catch(() => {});
			return;
		}

		const ownerBlacklisted = await db
			.select()
			.from(blacklist)
			.where(eq(blacklist.targetId, ownerID))
			.then((rows) => rows.find((r) => r.type === 'user'));

		if (ownerBlacklisted) {
			await guild.leave().catch(() => {});
			return;
		}

		await db
			.insert(guilds)
			.values({
				name: guild.name,
				ownerId: ownerID,
				id: guild.id,
			})
			.onConflictDoNothing();
	},
});
