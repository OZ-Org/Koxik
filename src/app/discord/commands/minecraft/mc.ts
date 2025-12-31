import { createCommand } from '@base';
import SkinSubCommand from './subcommands/skin.js';

export default createCommand({
	name: 'mc',
	description: 'View minecraft users from java players!',
	cooldown: 3,
	baseCommand: true,
}).addSubCommands([SkinSubCommand]);
