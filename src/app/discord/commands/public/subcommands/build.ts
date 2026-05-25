import { createSubCommand } from '@base';
import { getShardData } from '@basedir/discord/client/bot/sharding.js';
import { createContainer, Separator } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const runtimeCache = (() => {
	let versions: any = null;
	let git: any = null;

	return {
		getVersions() {
			if (versions) return versions;

			let bun = 'unknown';
			let packages = 'unknown';

			try {
				bun = execSync('bun --version').toString().trim();
			} catch {}

			try {
				const pkgPath = path.join(process.cwd(), 'package.json');
				const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
				const deps = Object.keys(pkg.dependencies ?? {}).length;
				const devDeps = Object.keys(pkg.devDependencies ?? {}).length;
				packages = `${deps + devDeps}`;
			} catch {}

			const isBun = !!process.versions.bun;

			versions = {
				bun,
				node: process.version,
				discord: require('discord.js').version,
				typescript: require('typescript/package.json').version,

				runtime: isBun ? `Bun ${process.versions.bun}` : process.release.name,
				platform: process.platform,
				arch: process.arch,
				packages,
			};

			return versions;
		},

		getGit() {
			if (git) return git;

			let version = 'unknown';

			try {
				version = execSync('git --version')
					.toString()
					.trim()
					.replace('git version ', '');
			} catch {}

			let commit = 'unknown';
			let shortCommit = 'unknown';
			let branch = 'unknown';
			let message = 'unknown';
			let author = 'unknown';
			let commitDate = 'unknown';

			try {
				commit = execSync('git rev-parse HEAD').toString().trim();

				shortCommit = execSync('git rev-parse --short HEAD').toString().trim();

				branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

				message = execSync('git log -1 --pretty=%s').toString().trim();

				author = execSync('git log -1 --pretty=%an').toString().trim();

				commitDate = execSync('git log -1 --pretty=%cr').toString().trim();
			} catch {}

			git = {
				version,
				commit,
				shortCommit,
				branch,
				message,
				author,
				commitDate,
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
		await res.ephemeral().defer();

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

		const { shardId, shardCount, isSharded } = getShardData();

		const displayShardId = isSharded ? (shardId ?? 0) + 1 : 1;

		const displayShardCount = isSharded ? (shardCount ?? 1) : 1;

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel(`Commit ${git.shortCommit}`)
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

				`## ⚡ Koxik Runtime Diagnostics
> everything is on fire but operational`,

				Separator.Default,

				`
🌿 **Environment:** \`${env}\`
🧩 **Shard:** \`${displayShardId}\` / \`${displayShardCount}\`

${emotes.tech.bun} **Bun:** \`${versions.bun}\`
${emotes.tech.djs} **discord.js:** \`${versions.discord}\`
${emotes.tech.typescript} **TypeScript:** \`${versions.typescript}\`

⚙️ **Runtime:** \`${versions.runtime}\`
🧠 **Platform:** \`${versions.platform}\`
🏗️ **Architecture:** \`${versions.arch}\`
📦 **Dependencies:** \`${versions.packages}\`
🔥 **PID:** \`${process.pid}\`

${emotes.tech.git} **Git Version:** \`${git.version}\`
🌿 **Branch:** \`${git.branch}\`

${emotes.tech.git} **Git Commit Message**
\`\`\`
${git.message}
\`\`\`

🔖 **Commit SHA**
\`\`\`
${git.commit}
\`\`\`

👤 **Author:** \`${git.author}\`
🕓 **Committed:** \`${git.commitDate}\`

⚡ **API Ping:** \`${wsPing}ms\`
⚡ **Response:** \`${totalPing}ms\`
🧠 **RAM Usage:** \`${ramUsed} MB\`

⏱️ **Client Uptime:** <t:${clientStartedAt}:R>
⏱️ **Process Uptime:** <t:${processStartedAt}:R>

📈 **Client Seconds:** \`${clientUptime}s\`
📈 **Process Seconds:** \`${processUptimeSec}s\`
`,

				Separator.Default,
				row,
			),
		];

		return res.update().v2(components);
	},
});
