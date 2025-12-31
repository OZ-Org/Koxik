import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { brBuilder, createEmbed } from '@magicyan/discord';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Colors,
} from 'discord.js';

export default createSubCommand({
	name: 'info',
	description: 'I show my information as a bot!',
	description_localizations: {
		'pt-BR': 'Eu mostro minhas informações como um bot!',
		'es-ES': '¡Muestro mi información como un bot!',
	},

	run: async ({ interaction, client }) => {
		const library = 'discord.js';
		const RAMUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
		const hostedBy = 'GatiHost';
		const version = '2.0.1';
		const website = 'https://koxik.ozorg.xyz';
		const invite =
			'https://discord.com/oauth2/authorize?client_id=1172215616227962624&permissions=516403096831&integration_type=0&scope=bot+applications.commands';
		const support = 'https://discord.gg/AfeQSwBsZV';
		const owner = 'Oz-Org';

		const members = client.users.cache.size;
		const guilds = client.guilds.cache.size;
		const channels = client.channels.cache.size;

		const uptimeTimestamp = Math.floor(
			(Date.now() - (client.uptime ?? 0)) / 1000,
		);

		const embed = createEmbed({
			title: replyLang(interaction.locale, 'koxik#info#title'),
			description: brBuilder(
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
				}),
			),
			color: Colors.Orange,
			footer: replyLang(interaction.locale, 'koxik#info#footer'),
		});

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

		await interaction.reply({
			embeds: [embed],
			components: [row],
			flags: ['Ephemeral'],
		});
	},
});
