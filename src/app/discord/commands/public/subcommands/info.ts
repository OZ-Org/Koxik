import { createSubCommand } from '@base';
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
		const RAMUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
		const sourceCode = 'https://github.com/KoxikBot/Koxik';
		const hostedBy = 'GatiHost';
		const version = '2.0.0';
		const website = 'https://koxik.ozorg.xyz';
		const invite =
			'https://discord.com/oauth2/authorize?client_id=1172215616227962624&permissions=8&redirect_uri=https%3A%2F%2Fkoxik.ozorg.xyz%2Fapi%2Fauth%2Fdiscord&response_type=code&scope=identify%20email%20guilds.members.read';
		const support = 'https://discord.gg/koxik';
		const owner = 'Oz-Org';

		const members = client.users.cache.size;
		const guilds = client.guilds.cache.size;
		const channels = client.channels.cache.size;

		const uptime = client.uptime ?? 143242;
		const uptimeTimestamp = Math.floor((Date.now() - uptime) / 1000);

		const embed = createEmbed({
			title: '🤖 **Koxik — Seu bot multiuso cheio de charme**',
			description: brBuilder(
				'Salve, humano. Eu sou a Koxik — elegante, funcional e sempre pronta pra animar o rolê!',
				' ',
				`### 🌍 Presença`,
				`• Servidores: **${guilds}**`,
				`• Pessoas interagindo comigo: **${members}**`,
				`• Canais monitorados: **${channels}**`,
				' ',
				`### ⚙️ Sistema`,
				`• Biblioteca: **${library}**`,
				`• Memória utilizada: **${RAMUsage} MB**`,
				`• Versão: **v${version}**`,
				`• Hospedada na **${hostedBy}**`,
				' ',
				`### ⏳ Uptime`,
				`• Estou viva há **<t:${uptimeTimestamp}:R>**`,
				' ',
				`🔑 Desenvolvido por: **${owner}**`,
			),
			color: Colors.Orange,
			footer: 'Koxik Bot • Sempre online… quase sempre.',
		});

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel('🌐 Website')
				.setStyle(ButtonStyle.Link)
				.setURL(website),
			new ButtonBuilder()
				.setLabel('📥 Invite')
				.setStyle(ButtonStyle.Link)
				.setURL(invite),
			new ButtonBuilder()
				.setLabel('💬 Suporte')
				.setStyle(ButtonStyle.Link)
				.setURL(support),
			new ButtonBuilder()
				.setLabel('💻 Código-Fonte')
				.setStyle(ButtonStyle.Link)
				.setURL(sourceCode),
			new ButtonBuilder()
				.setLabel('Hosted by GatiHost')
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
