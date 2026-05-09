import { createCommand } from '@base';
import { MarrySubCommand } from './subcommands/marry.js';
import { DateSubCommand } from './subcommands/date.js';
import { KissSubCommand } from './subcommands/kiss.js';

export default createCommand({
	name: 'rp',
	description: 'Roleplay Commands',
	baseCommand: true,
}).addSubCommands([MarrySubCommand, DateSubCommand, KissSubCommand]);
