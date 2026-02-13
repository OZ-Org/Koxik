import { GuildController } from '@app/jobs/GuildController.js';
import { createEvent } from '@base';
import { logger } from '@fx/utils/logger.js';
import { findChannel } from '@magicyan/discord';
import {
	type Guild,
	type GuildTextBasedChannel,
	PermissionsBitField,
} from 'discord.js';

const processedMembers = new Set();

async function canSendToChannel(
	channelId: string,
	guild: Guild,
): Promise<boolean> {
	const channel = guild.channels.cache.get(channelId) as
		| GuildTextBasedChannel
		| undefined;
	if (!channel) return false;

	const botMember = await guild.members.fetchMe();
	if (!botMember) return false;

	const permissions = channel.permissionsFor(botMember);
	if (!permissions) return false;

	return permissions.has([
		PermissionsBitField.Flags.ViewChannel,
		PermissionsBitField.Flags.SendMessages,
	]);
}

export default createEvent({
	name: 'leave',
	event: 'guildMemberRemove',
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

			const config = await GuildController.getLeaveConfig(guildId);

			if (config?.enable && config.channelId) {
				const canSend = await canSendToChannel(config.channelId, member.guild);
				if (!canSend) {
					return;
				}

				const channel = findChannel(member.guild).byId(config.channelId);

				if (channel) {
					const msg = GuildController.formatMessage(
						config.message,
						userId,
						member.guild.name,
					);

					await channel.send({
						content: msg,
					});
				}
			}
		} catch (err) {
			logger.error('Erro no guildMemberRemove:', err);
		}
	},
});
