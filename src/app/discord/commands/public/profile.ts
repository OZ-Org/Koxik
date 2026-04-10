import { createCommand } from '@base';
import AboutMeSubCommand from './subcommands/perfil/aboutme.js';
import ViewSubCommand from './subcommands/perfil/ver.js';

export default createCommand({
	name: 'profile',
	name_localizations: {
		'pt-BR': 'perfil',
		'es-ES': 'perfil',
	},

	description: 'User profile commands',
	description_localizations: {
		'pt-BR': 'Comandos de perfil do usuário',
		'es-ES': 'Comandos de perfil del usuario',
	},

	baseCommand: true,
}).addSubCommands([ViewSubCommand, AboutMeSubCommand]);
