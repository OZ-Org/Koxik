import { createCommand } from '@base';
import discord from './subcommands/automod/discord.js';

export default createCommand({
	name: 'automod',
	description: 'Manage automod settings',
	cooldown: 3,
	baseCommand: true,
}).addSubCommandGroup([discord]);
