import { createCommand } from '@base';
import AvatarSubCommand from './subcommands/user/avatar.js';
import InfoSubCommand from './subcommands/user/info.js';

export default createCommand({
	name: 'user',
	description: 'User commands',
	baseCommand: true,
}).addSubCommands([InfoSubCommand, AvatarSubCommand]);
