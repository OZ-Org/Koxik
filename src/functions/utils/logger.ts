import chalk from 'chalk';
import { table } from 'table';

export const logger = {
	error: (message: unknown, ...args: any) => {
		console.error(chalk.bgRed.black(' ERROR '), chalk.red(message), ...args);
	},
	warn: (message: unknown, ...args: any) => {
		console.warn(
			chalk.bgYellow.black(' WARN  '),
			chalk.yellow(message),
			...args,
		);
	},
	info: (message: unknown, ...args: any) => {
		console.log(chalk.bgBlue.white(' INFO  '), chalk.blue(message), ...args);
	},
	debug: (message: unknown, ...args: any) => {
		if (process.env.NODE_ENV !== 'production') {
			// Apenas em desenvolvimento
			console.log(chalk.bgCyan.black(' DEBUG '), chalk.cyan(message), ...args);
		}
	},
	success: (message: unknown, ...args: any) => {
		console.log(
			chalk.bgGreen.black(' SUCCESS '),
			chalk.green(message),
			...args,
		);
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
			columns: {},
			border: {
				topBody: `─`,
				topJoin: `┬`,
				topLeft: `┌`,
				topRight: `┐`,
				bottomBody: `─`,
				bottomJoin: `┴`,
				bottomLeft: `└`,
				bottomRight: `┘`,
				bodyLeft: `│`,
				bodyRight: `│`,
				bodyJoin: `┼`,
				joinBody: `─`,
				joinLeft: `├`,
				joinRight: `┤`,
			},
			...options,
		};

		const formattedHeaders = headers.map((header) => chalk.bold(header));

		const formattedData = data.map((row) =>
			row.map((cell: any) => String(cell)),
		); // Converte para string

		const output = table([formattedHeaders, ...formattedData], config);
		console.log(output);
	},
};
