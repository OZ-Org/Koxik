import { createSubCommandGroup } from '@base';
import LinksSubCommand from './discord/links.js';
import ServerSubCommand from './discord/servers.js';

export default createSubCommandGroup(
	{
		name: 'discord',
		description: 'Manage automod settings for discord',
	},
	[ServerSubCommand, LinksSubCommand],
);
