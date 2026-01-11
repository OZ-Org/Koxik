import { createSubCommandGroup } from "@base";
import ServerSubCommand from "./discord/servers.js";
import LinksSubCommand from "./discord/links.js";

export default createSubCommandGroup({
    name: 'discord',
    description: 'Manage automod settings for discord',
}, [
    ServerSubCommand,
    LinksSubCommand
])