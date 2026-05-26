import { createCommand } from '@base';
import { WhichSubCommand } from './subcommands/miraculous/qual.js';

export default createCommand({
	name: 'miraculous',
	description: 'Miraculous related commands',
	baseCommand: true,
}).addSubCommands([WhichSubCommand]);
