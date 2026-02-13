import { createCommand } from '@base';
import { PermissionsBitField } from 'discord.js';
import WelcomeSubcommand from './subcommands/config/welcome.js';

export default createCommand({
	name: 'config',
	description: 'Config subcommands',
	default_member_permissions: [PermissionsBitField.Flags.ManageGuild],
	baseCommand: true,
}).addSubCommands([WelcomeSubcommand]);
