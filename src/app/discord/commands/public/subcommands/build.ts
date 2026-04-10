import { createSubCommand } from '@base';
import { createContainer, Separator } from '@magicyan/discord';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { execSync } from 'node:child_process';
import os from 'node:os';

function getGitInfo() {
	try {
		const commit = execSync('git rev-parse --short HEAD').toString().trim();
		const branch = execSync('git rev-parse --abbrev-ref HEAD')
			.toString()
			.trim();

		return {
			commit,
			branch,
			url: `https://github.com/OZ-Org/Koxik/commit/${commit}`,
		};
	} catch {
		return {
			commit: 'unknown',
			branch: 'unknown',
			url: 'https://github.com/OZ-Org/Koxik',
		};
	}
}

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

		const git = getGitInfo();
		const uptime = Math.floor(process.uptime());

		const wsPing = client.ws.ping;

		let dbPing = 'N/A';
		try {
			const dbStart = Date.now();
			dbPing = `${Date.now() - dbStart}ms`;
		} catch {
			dbPing = 'error';
		}

		const ramUsed = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
		const cpu = os.cpus()[0].model;

		const env = process.env.NODE_ENV ?? 'production';

		const totalPing = Date.now() - start;

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

				`> **Branch:** \`${git.branch}\`
> **Commit:** \`${git.commit}\`
> **Env:** \`${env}\`

### ⚡ Performance
> **API Ping:** \`${wsPing}ms\`
> **DB Ping:** \`${dbPing}\`
> **Response:** \`${totalPing}ms\`

### 🖥️ System
> **RAM:** \`${ramUsed} MB\`
> **CPU:** \`${cpu}\`

### ⏱️ Runtime
> **Uptime:** \`${uptime}s\``,

				row,
			),
		];

		return res.ephemeral().v2(components);
	},
});
