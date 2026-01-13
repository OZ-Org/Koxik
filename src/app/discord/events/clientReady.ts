import { createEvent } from '@base';
import { ActivityType, type Client } from 'discord.js';
import { env } from '@env';
import { AutoPoster } from 'topgg-autoposter'
import { logger } from '@fx/utils/logger.js';

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
				name: `over ${client.users.cache.size} users`,
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
		}, 60_000); // troca a cada 30s

		AutoPoster(env.TOPGG_TOKEN, client).on("posted", () => {
			logger.success("Posted stats on top.gg!")
		})
	},
});
