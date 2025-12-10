import { createEvent } from '@base';
import { guilds } from '@schemas';
import { db } from "@db";
import { eq } from "drizzle-orm";

export default createEvent({
  name: 'guildDelete',
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
