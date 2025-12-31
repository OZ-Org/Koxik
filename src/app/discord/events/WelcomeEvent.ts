import { createEvent } from '@base';
import { db } from '@db';
import { logger } from '@fx/utils/logger.js';
import { findChannel } from '@magicyan/discord';
import { guilds } from '@schemas';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { eq } from 'drizzle-orm';

const processedMembers = new Set();

function createWelcomeButton(guildId: string) {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`welcome/log/${guildId}`)
			.setLabel('👋 Welcome!')
			.setStyle(ButtonStyle.Secondary),
	);
}

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

					await channel.send({
						content: msg,
						components: [createWelcomeButton(member.guild.id)],
					});
				}
			}
		} catch (err) {
			logger.error('Erro no guildMemberAdd:', err);
		}
	},
});
