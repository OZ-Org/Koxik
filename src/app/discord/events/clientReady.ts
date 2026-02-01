import { createEvent } from '@base';
import { env } from '@env';
import { logger } from '@fx/utils/logger.js';
import { ActivityType, type Client } from 'discord.js';
import { AutoPoster } from 'topgg-autoposter';

export default createEvent({
	name: 'ready:activity',
	event: 'clientReady',
	once: true,
	run: async (client: Client) => {
		const getStatuses = () => [
			{
				name: `with ${client.guilds.cache.size} servers`,
				type: ActivityType.Playing,
			},
			{
				name: `over ${client.guilds.cache.reduce(
					(total, guild) => total + guild.memberCount,
					0,
				)} users`,
				type: ActivityType.Watching,
			},
			{
				name: `slash commands`,
				type: ActivityType.Listening,
			},
			{
				name: `async dreams`,
				type: ActivityType.Playing,
			},
			{
				name: `TypeScript thoughts`,
				type: ActivityType.Competing,
			},
			{
				name: `online… probably`,
				type: ActivityType.Playing,
			},
		];

		let index = 0;

		setInterval(() => {
			const statuses = getStatuses();
			const status = statuses[index % statuses.length];

			client.user?.setActivity(status.name, {
				type: status.type,
			});

			index++;
		}, 60_000);

		if (env.TOPGG_TOKEN) {
			setTimeout(
				() => {
					if (env.TOPGG_TOKEN)
						AutoPoster(env.TOPGG_TOKEN, client).on('posted', () => {
							logger.success('Posted stats on top.gg!');
						});
				},
				10 * 60 * 60 * 1000,
			);
		} else return;
	},
});
