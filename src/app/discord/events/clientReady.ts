import { createEvent } from '@base';
import { env } from '@env';
import { logger } from '@fx/utils/logger.js';
import { getMusicStatus } from '@app/discord/utils/musicStatus.js';
import { isShardManager } from '@basedir/discord/client/bot/sharding.js';
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

		setInterval(async () => {
			const musicStatus = await getMusicStatus();

			if (musicStatus) {
				client.user?.setActivity(musicStatus.name, {
					type: musicStatus.type,
				});
				return;
			}

			const statuses = getStatuses();
			const status = statuses[index % statuses.length];

			client.user?.setActivity(status.name, {
				type: status.type,
			});

			index++;
		}, 60_000);

		if (env.TOPGG_TOKEN) {
			if (process.env.KOXIK_SHARD === 'true') {
				const report = () => {
					if (!process.send) return;

					process.send({
						type: 'GUILD_COUNT',
						shardId: Number(process.env.SHARD_ID),
						count: client.guilds.cache.size,
					});
				};

				report();
				setInterval(report, 30 * 60 * 1000);
			} else if (!isShardManager()) {
				setTimeout(
					() => {
						AutoPoster(env.TOPGG_TOKEN!, client).on('posted', () => {
							logger.success('Posted stats on top.gg!');
						});
					},
					10 * 60 * 60 * 1000,
				);
			}
		}
	},
});
