import { createSubCommand } from '@base';
import { createContainer, Separator } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { execSync } from 'node:child_process';

const runtimeCache = (() => {
	let versions: any = null;
	let git: any = null;

	return {
		getVersions() {
			if (versions) return versions;

			let bun = 'unknown';

			try {
				bun = execSync('bun --version').toString().trim();
			} catch {}

			versions = {
				bun,
				node: process.version,
				discord: require('discord.js').version,
				typescript: require('typescript/package.json').version,
			};

			return versions;
		},

		getGit() {
			if (git) return git;

			let version = 'unknown';
			let commit = 'unknown';
			let branch = 'unknown';

			try {
				version = execSync('git --version')
					.toString()
					.trim()
					.replace('git version ', '');
			} catch {}

			try {
				commit = execSync('git rev-parse --short HEAD').toString().trim();
				branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
			} catch {}

			git = {
				version,
				commit,
				branch,
				url: `https://github.com/OZ-Org/Koxik/commit/${commit}`,
			};

			return git;
		},
	};
})();

export default createSubCommand({
	name: 'build',
	name_localizations: {
		'pt-BR': 'build',
		'es-ES': 'build',
	},

	description: 'See my nerd info... wait, nerd info?',
	description_localizations: {
		'pt-BR': 'Veja minhas informações para nerds... perae, pra nerds?',
		'es-ES': 'Mira mi información técnica... espera, ¿para nerds?',
	},
	cooldown: 10,

	run: async ({ res, client }) => {
		const start = Date.now();

		const versions = runtimeCache.getVersions();
		const git = runtimeCache.getGit();

		const clientUptimeMs = client.uptime ?? 0;
		const clientUptime = Math.floor(clientUptimeMs / 1000);
		const clientStartedAt = Math.floor((Date.now() - clientUptimeMs) / 1000);

		const processUptimeSec = Math.floor(process.uptime());
		const processStartedAt = Math.floor(Date.now() / 1000) - processUptimeSec;

		const wsPing = client.ws.ping;

		const ramUsed = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
		const env = process.env.NODE_ENV ?? 'production';
		const totalPing = Date.now() - start;

		const hasSharding = !!client.shard;

		const rawShardId = client.shard?.ids?.[0] ?? 0;
		const shardCount = client.shard?.count ?? 1;

		const displayShardId = hasSharding ? rawShardId + 1 : 0;
		const displayShardCount = hasSharding ? shardCount : 0;

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel('Commit')
				.setStyle(ButtonStyle.Link)
				.setURL(git.url),
			new ButtonBuilder()
				.setLabel('Repository')
				.setStyle(ButtonStyle.Link)
				.setURL('https://github.com/OZ-Org/Koxik'),
		);

		const components = [
			createContainer(
				5763719,
				`## 🧠 Build Info`,
				Separator.Default,

				`
🌿 **Env:** \`${env}\`
🧩 **Shard:** \`${displayShardId}\` / \`${displayShardCount}\`
${emotes.tech.bun} **Bun:** \`${versions.bun}\`
${emotes.tech.djs} **discord.js:** \`${versions.discord}\`
${emotes.tech.typescript} **TypeScript:** \`${versions.typescript}\`
${emotes.tech.git} **Version:** \`${git.version}\`
${emotes.tech.git} **Branch:** \`${git.branch}\`
${emotes.tech.git} **Commit:** \`${git.commit}\`
⚡ **API Ping:** \`${wsPing}ms\`
⚡ **Response:** \`${totalPing}ms\`
⚡ **RAM:** \`${ramUsed} MB\`
⏱️ **Client Uptime:** <t:${clientStartedAt}:R> \`${clientUptime}s\`
⏱️ **Process Uptime:** <t:${processStartedAt}:R> \`${processUptimeSec}s\`
`,
				Separator.Default,
				row,
			),
		];

		return res.ephemeral().v2(components);
	},
});
