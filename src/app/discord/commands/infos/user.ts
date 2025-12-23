import { createCommand } from '@base';
import InfoSubCommand from "./subcommands/user/info.js";
import AvatarSubCommand from "./subcommands/user/avatar.js";

export default createCommand({
	name: "user",
	description: "User commands",
	baseCommand: true
})
	.addSubCommands([
		InfoSubCommand,
		AvatarSubCommand
	]);