import { createEvent } from '@base';
import { db } from '@db';
import { guilds } from '@schemas';
import { eq } from 'drizzle-orm';

export default createEvent({
	name: "remove:guild:database",
	event: 'guildDelete',
	once: false,
	run: async (guild) => {
		const guildID = guild.id;

		// pulveriza o registro da guilda
		await db
			.delete(guilds)
			.where(eq(guilds.id, guildID))
			.catch(() => { });
	},
});
