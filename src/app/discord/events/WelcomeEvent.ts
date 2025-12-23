import { createEvent } from '@base';
import { db } from '@db';
import { logger } from '@fx/utils/logger.js';
import { findChannel } from '@magicyan/discord';
import { guilds } from '@schemas';
import { eq } from 'drizzle-orm';

const processedMembers = new Set();

export default createEvent({
	name: 'welcome',
	event: 'guildMemberAdd',
	run: async (member) => {
		try {

			const key = `${member.guild.id}-${member.id}`;

			if (processedMembers.has(key)) {
				return;
			}

			processedMembers.add(key);

			setTimeout(() => {
				processedMembers.delete(key);
			}, 60000);

			const guildId = member.guild.id;
			const userId = member.id;

			const guildConfig = await db
				.select()
				.from(guilds)
				.where(eq(guilds.id, guildId));

			if (guildConfig.length === 0) {
				return;
			}

			const cfg = guildConfig[0].configs?.movementLogs?.welcome;

			if (cfg?.enable) {
				const channel = findChannel(member.guild).byId(cfg.channelId);

				if (channel) {
					const msg = cfg.message
						.replace('{user}', `<@${userId}>`)
						.replace('{server.name}', member.guild.name);

					await channel.send(msg);
				}
			}
		} catch (err) {
			logger.error('Erro no guildMemberAdd:', err);
		}
	},
});
