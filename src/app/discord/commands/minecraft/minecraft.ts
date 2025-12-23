// minecraft.ts
import { createCommand } from '@base';
import MineSubcommand from './subcommands/mine.js';
import StartSubcommand from './subcommands/start.js';

export default createCommand({
	name: 'minecraft',
	description: 'Minecraft Subcommands',
	baseCommand: true,
}).addSubCommands([StartSubcommand, MineSubcommand]);
