import { createCommand } from '@base';
import AboutMeSubCommand from './subcommands/perfil/aboutme.js';
import ViewSubCommand from './subcommands/perfil/ver.js';

export default createCommand({
	name: 'perfil',
	description: 'Comandos de perfil do usuário',
	baseCommand: true,
}).addSubCommands([ViewSubCommand, AboutMeSubCommand]);
