import { createCommand } from '@base';
import { balanceSubCommand } from './subcommands/balance.js';
import { dailySubCommand } from './subcommands/daily.js';
import { depositSubCommand } from './subcommands/deposit.js';
import { leaderboardSubCommand } from './subcommands/leaderboard.js';
import { paySubCommand } from './subcommands/pay.js';

export default createCommand({
	name: 'eco',
	description: 'Economy commands',
	description_localizations: {
		'pt-BR': 'Comandos de economia',
		'es-ES': 'Comandos de economía',
	},
	baseCommand: true,
}).addSubCommands([
	balanceSubCommand,
	depositSubCommand,
	paySubCommand,
	dailySubCommand,
	leaderboardSubCommand,
]);
