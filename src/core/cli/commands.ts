import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Command as CLI } from 'commander';

const program = new CLI();

const ROOT = path.resolve(process.cwd(), 'src/app/discord');
const COMMANDS_PATH = path.join(ROOT, 'commands');

type JsonCommand = {
	name: string;
	description?: string;
	name_localizations?: Record<string, string | null>;
	description_localizations?: Record<string, string | null>;
	category: string;
	subcommands?: {
		name: string;
		description?: string;
		options?: any[];
		name_localizations?: Record<string, string | null>;
		description_localizations?: Record<string, string | null>;
	}[];
	default_permissions?: any[];
	options?: any[];
};

program
	.name('koxik-cli')
	.description('Ferramentas internas do bot')
	.version('1.0.0');

program
	.command('commands:export')
	.option('-o, --out <file>', 'Arquivo de saída', 'commands.json')
	.description('Gera um JSON com todos os comandos e subcomandos')
	.action(async (opts) => {
		const output: JsonCommand[] = [];

		const folders = await readdir(COMMANDS_PATH, { withFileTypes: true });

		for (const folder of folders) {
			if (!folder.isDirectory()) continue;

			const folderPath = path.join(COMMANDS_PATH, folder.name);
			const files = await readdir(folderPath);

			for (const file of files) {
				if (!file.endsWith('.ts')) continue;

				const filePath = path.join(folderPath, file);
				const fileUrl = pathToFileURL(filePath).href;

				const mod = await import(fileUrl);
				const command = mod.default;

				if (!command?.data) continue;

				const json = command.data.toJSON();

				const entry: JsonCommand = {
					name: json.name,
					name_localizations: json.name_localizations,
					description_localizations: json.description_localizations,
					description: json.description,
					category: folder.name,
				};

				if (json.options?.length) {
					entry.subcommands = json.options
						.filter((o: any) => o.type === 1 || o.type === 2)
						.map((sub: any) => ({
							name: sub.name,
							description: sub.description,
							name_localizations: sub.name_localizations,
							description_localizations: sub.description_localizations,
							options: sub.options ?? [],
						}));

					entry.options = json.options.filter(
						(o: any) => o.type !== 1 && o.type !== 2,
					);
				}

				output.push(entry);
			}
		}

		await writeFile(opts.out, JSON.stringify(output, null, 2), 'utf-8');

		console.log(`✔ Comandos exportados para ${opts.out}`);
		process.exit(0);
	});
program.parse();
