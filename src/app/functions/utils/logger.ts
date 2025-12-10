import { env } from '@env';
import chalk from 'chalk';
import { table } from 'table';

const timestamp = () =>
	chalk.gray(new Date().toISOString().replace('T', ' ').split('.')[0]);

const label = (text: string, bg: (str: string) => string) =>
	bg(` ${text.toUpperCase().padEnd(7)} `);

export const logger = {
	error: (message: unknown, ...args: any) => {
		console.error(
			timestamp(),
			label('error', chalk.bgRed.black),
			chalk.red(message),
			...args,
		);
	},

	warn: (message: unknown, ...args: any) => {
		console.warn(
			timestamp(),
			label('warn', chalk.bgYellow.black),
			chalk.yellow(message),
			...args,
		);
	},

	info: (message: unknown, ...args: any) => {
		console.log(
			timestamp(),
			label('info', chalk.bgBlue.white),
			chalk.blue(message),
			...args,
		);
	},

	debug: (message: unknown, ...args: any) => {
		if (env.NODE_ENV !== 'production') {
			console.log(
				timestamp(),
				label('debug', chalk.bgCyan.black),
				chalk.cyan(message),
				...args,
			);
		}
	},

	success: (message: unknown, ...args: any) => {
		console.log(
			timestamp(),
			label('success', chalk.bgGreen.black),
			chalk.green(message),
			...args,
		);
	},

	divider: (text = '') => {
		const line = '─'.repeat(40);
		console.log(chalk.gray(`\n${line} ${chalk.bold(text)} ${line}\n`));
	},

	banner: (title: string) => {
		const box = `\n${chalk.magentaBright('╔' + '═'.repeat(title.length + 4) + '╗')}
${chalk.magentaBright('║')}  ${chalk.bold.cyan(title)}  ${chalk.magentaBright('║')}
${chalk.magentaBright('╚' + '═'.repeat(title.length + 4) + '╝')}\n`;

		console.log(box);
	},

	table: (data: any[], headers: any[], options = {}) => {
		if (!Array.isArray(data) || data.length === 0) {
			logger.warn('Tabela vazia ou dados inválidos para table()');
			return;
		}

		if (!Array.isArray(headers) || headers.length === 0) {
			logger.warn('Cabeçalhos inválidos para table()');
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
		console.log(output);
	},
};
