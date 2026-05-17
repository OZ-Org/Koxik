import { createCommand } from '@base';
import { PutzSubCommand } from './subcommands/brasil/putz.js';

export default createCommand({
	name: 'brazil',

	name_localizations: {
		'pt-BR': 'brasil',
		'es-ES': 'brasil',
	},

	description: '[memes] BRAZIL MENTIONED 🇧🇷',

	description_localizations: {
		'pt-BR': '[memes] É Brasil com S porra',
		'es-ES': '[memes] ES BRASIL CON S CARAJO 🇧🇷',
	},
	baseCommand: true,
}).addSubCommands([PutzSubCommand]);
