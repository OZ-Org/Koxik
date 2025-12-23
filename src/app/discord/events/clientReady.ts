import { ActivityType, type Client } from 'discord.js';
import { createEvent } from 'index.js';

export default createEvent({
	name: 'ready:activity',
	event: 'clientReady',
	once: false,
	run: async (client: Client) => {
		client.user?.setActivity(`with ${client.guilds.cache.size} servers!`, {
			type: ActivityType.Playing,
		});
	},
});
