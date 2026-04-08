import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { brBuilder, createContainer, Separator } from '@magicyan/discord';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default createSubCommand({
	name: 'info',
	description: 'I show my information as a bot!',
	description_localizations: {
		'pt-BR': 'Eu mostro minhas informações como um bot!',
		'es-ES': '¡Muestro mi información como un bot!',
	},

	run: async ({ interaction, client, res }) => {
		const library = 'discord.js';
		const RAMUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
		const hostedBy = 'GatiHost';
		const version = '2.0.1';
		const website = 'https://koxik.ozorg.xyz';
		const invite =
			'https://discord.com/oauth2/authorize?client_id=1446227976793493594&permissions=6759076403735799&integration_type=0&scope=bot+applications.commands';
		const support = 'https://discord.gg/AfeQSwBsZV';
		const owner = 'Oz-Org';

		const shardId = client.shard?.ids?.[0] ?? 0;
		const shardCount = client.shard?.count ?? 1;

		let guilds = 0;
		let members = 0;
		let channels = 0;

		if (client.shard) {
			const results = await client.shard.broadcastEval((c) => ({
				guilds: c.guilds.cache.size,
				members: c.guilds.cache.reduce((total, g) => total + g.memberCount, 0),
				channels: c.channels.cache.size,
			}));

			guilds = results.reduce((a, b) => a + b.guilds, 0);
			members = results.reduce((a, b) => a + b.members, 0);
			channels = results.reduce((a, b) => a + b.channels, 0);
		} else {
			guilds = client.guilds.cache.size;
			members = client.guilds.cache.reduce(
				(total, guild) => total + guild.memberCount,
				0,
			);
			channels = client.channels.cache.size;
		}

		const uptimeTimestamp = Math.floor(
			(Date.now() - (client.uptime ?? 0)) / 1000,
		);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel(replyLang(interaction.locale, 'koxik#info#buttons#website'))
				.setStyle(ButtonStyle.Link)
				.setURL(website),

			new ButtonBuilder()
				.setLabel(replyLang(interaction.locale, 'koxik#info#buttons#invite'))
				.setStyle(ButtonStyle.Link)
				.setURL(invite),

			new ButtonBuilder()
				.setLabel(replyLang(interaction.locale, 'koxik#info#buttons#support'))
				.setStyle(ButtonStyle.Link)
				.setURL(support),

			new ButtonBuilder()
				.setLabel(replyLang(interaction.locale, 'koxik#info#buttons#hosted'))
				.setEmoji('<:gatihost:1447718834080321598>')
				.setStyle(ButtonStyle.Link)
				.setURL('https://www.gatihost.com.br'),
		);

		return res.ephemeral().v2([
			createContainer(
				'#a7c957',
				`# ${replyLang(interaction.locale, 'koxik#info#title')}`,
				brBuilder(
					replyLang(interaction.locale, 'koxik#info#description', {
						guilds,
						members,
						channels,
						library,
						ram: RAMUsage,
						version,
						host: hostedBy,
						uptime: uptimeTimestamp,
						owner,
						shard: `${shardId + 1}/${shardCount}`,
					}),
				),
				Separator.Default,
				row,
			),
		]);
	},
});
