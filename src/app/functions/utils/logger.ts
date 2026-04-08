import { env } from '@env';
import chalk from 'chalk';
import { table } from 'table';
import fs from 'node:fs';
import path from 'node:path';

const shardId = process.env.SHARD_ID ?? 'main';

const logDir = path.resolve('./logs');
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `shard-${shardId}.log`);

const writeFile = (msg: string) => {
	fs.appendFileSync(logFile, msg + '\n');
};

const timestampRaw = () =>
	new Date().toISOString().replace('T', ' ').split('.')[0];

const timestamp = () => chalk.gray(timestampRaw());

const label = (text: string, bg: (str: string) => string) =>
	bg(` ${text.toUpperCase().padEnd(7)} `);

const prefix = () => chalk.magenta(`[Shard ${shardId}]`);

function formatForFile(type: string, message: unknown, args: any[]) {
	return `[${timestampRaw()}] [Shard ${shardId}] [${type.toUpperCase()}] ${String(message)} ${args.map(String).join(' ')}`;
}

export const logger = {
	error: (message: unknown, ...args: any) => {
		const line = formatForFile('error', message, args);
		writeFile(line);

		console.error(
			timestamp(),
			prefix(),
			label('error', chalk.bgRed.black),
			chalk.red(message),
			...args,
		);
	},

	warn: (message: unknown, ...args: any) => {
		const line = formatForFile('warn', message, args);
		writeFile(line);

		console.warn(
			timestamp(),
			prefix(),
			label('warn', chalk.bgYellow.black),
			chalk.yellow(message),
			...args,
		);
	},

	info: (message: unknown, ...args: any) => {
		const line = formatForFile('info', message, args);
		writeFile(line);

		console.log(
			timestamp(),
			prefix(),
			label('info', chalk.bgBlue.white),
			chalk.blue(message),
			...args,
		);
	},

	debug: (message: unknown, ...args: any) => {
		if (env.NODE_ENV !== 'production') {
			const line = formatForFile('debug', message, args);
			writeFile(line);

			console.log(
				timestamp(),
				prefix(),
				label('debug', chalk.bgCyan.black),
				chalk.cyan(message),
				...args,
			);
		}
	},

	success: (message: unknown, ...args: any) => {
		const line = formatForFile('success', message, args);
		writeFile(line);

		console.log(
			timestamp(),
			prefix(),
			label('success', chalk.bgGreen.black),
			chalk.green(message),
			...args,
		);
	},

	divider: (text = '') => {
		const line = '─'.repeat(40);
		const output = `\n${line} ${text} ${line}\n`;

		writeFile(output);

		console.log(chalk.gray(`\n${line} ${chalk.bold(text)} ${line}\n`));
	},

	banner: (title: string) => {
		const box = `\n╔${'═'.repeat(title.length + 4)}╗
║  ${title}  ║
╚${'═'.repeat(title.length + 4)}╝\n`;

		writeFile(box);

		console.log(
			`\n${chalk.magentaBright(`╔${'═'.repeat(title.length + 4)}╗`)}
${chalk.magentaBright('║')}  ${chalk.bold.cyan(title)}  ${chalk.magentaBright('║')}
${chalk.magentaBright(`╚${'═'.repeat(title.length + 4)}╝`)}\n`,
		);
	},

	table: (data: any[], headers: any[], options = {}) => {
		if (!Array.isArray(data) || data.length === 0) {
			logger.warn('Tabela vazia ou dados inválidos');
			return;
		}

		const config = {
			border: {
				topBody: `━`,
				topJoin: `┯`,
				topLeft: `┏`,
				topRight: `┓`,
				bottomBody: `━`,
				bottomJoin: `┷`,
				bottomLeft: `┗`,
				bottomRight: `┛`,
				bodyLeft: `┃`,
				bodyRight: `┃`,
				bodyJoin: `┼`,
				joinBody: `─`,
				joinLeft: `┠`,
				joinRight: `┨`,
			},
			...options,
		};

		const formattedHeaders = headers.map((h) => chalk.bold.blue(h));
		const formattedData = data.map((row) =>
			row.map((cell: any) => chalk.white(String(cell))),
		);

		const output = table([formattedHeaders, ...formattedData], config);

		writeFile(output);
		console.log(output);
	},
};
