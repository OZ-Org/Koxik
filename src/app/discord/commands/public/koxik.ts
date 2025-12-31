import { createCommand } from 'index.js';
import AnalyticsSubCommand from './subcommands/analytics.js';
import InfoSubCommand from './subcommands/info.js';

import InviteSubCommand from './subcommands/invite.js';

export default createCommand({
	name: 'koxik',
	description: 'Subcommand to view Koxik information.',
	description_localizations: {
		'pt-BR': 'Sub-Comando para ver informações do Koxik.',
		'es-ES': 'Subcomando para ver información de Koxik.',
	},
	baseCommand: true,
}).addSubCommands([AnalyticsSubCommand, InfoSubCommand, InviteSubCommand]);
