import { createEvent } from '@base';
import { logger } from '@fx/utils/logger.js';
import { loadWorkers } from '@basedir/discord/client/bot/loaders.js';
import { preloadBlacklistCache } from '@basedir/discord/client/bot/middleware.js';
import { ActivityType } from 'discord.js';
import { MusicController } from '@basedir/music/MusicController.js';
import type { KoxikClient } from '@basedir/discord/client/bot/CustomClient.js';
import { setupMusicPresence } from '@app/discord/utils/musicPresence.js';

export default createEvent({
	name: 'ready:activity',
	event: 'clientReady',
	once: true,
	run: async (client: KoxikClient) => {
		await loadWorkers(client);
		await preloadBlacklistCache();

		const musicController = new MusicController();
		setupMusicPresence(client, musicController);
		musicController.start();
		client.setCustomVariable('musicController', musicController);

		const getStatuses = () => {
			const guildCount =
				client.getCustomVariable<number>('totalGuildCount') ??
				client.guilds.cache.size;

			return [
				{
					name: `with ${guildCount} servers`,
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
					name: 'slash commands',
					type: ActivityType.Listening,
				},
				{
					name: 'async dreams',
					type: ActivityType.Playing,
				},
				{
					name: 'TypeScript thoughts',
					type: ActivityType.Competing,
				},
				{
					name: 'online… probably',
					type: ActivityType.Playing,
				},
			];
		};

		let index = 0;

		setInterval(() => {
			if (musicController.musicModeActive) return;

			const statuses = getStatuses();
			const status = statuses[index % statuses.length];

			client.user?.setActivity(status.name, {
				type: status.type,
			});

			index++;
		}, 60_000);


	},
});
