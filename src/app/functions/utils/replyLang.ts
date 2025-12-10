import fs from 'node:fs/promises';
import type { Locale } from 'discord.js';
import type enUSSchema from '../../../../config/lang/enUs.lang.json';
import type esESSchema from '../../../../config/lang/esEs.lang.json';
import type ptBRSchema from '../../../../config/lang/ptBr.lang.json';

// ------------------ TIPOS ------------------
type Variables = Record<string, string | number | boolean>;

// Cria paths infinitas para intellisense
type Join<K, P> = K extends string | number
	? P extends string | number
	? `${K}#${P}`
	: never
	: never;

type NestedKeys<T> = T extends object
	? {
		[K in keyof T]: T[K] extends object ? K | Join<K, NestedKeys<T[K]>> : K;
	}[keyof T]
	: never;
// ------------------ CARREGA LANGS UMA VEZ ------------------
type Languages = {
	'pt-BR': typeof ptBRSchema;
	'en-US': typeof enUSSchema;
	'es-ES': typeof esESSchema;
};

const languages: Languages = {
	'pt-BR': JSON.parse(
		await fs.readFile('./config/lang/ptBr.lang.json', 'utf-8'),
	),
	'en-US': JSON.parse(
		await fs.readFile('./config/lang/enUs.lang.json', 'utf-8'),
	),
	'es-ES': JSON.parse(
		await fs.readFile('./config/lang/esEs.lang.json', 'utf-8'),
	),
};

const localeMap: Partial<Record<Locale, keyof Languages>> = {
	'pt-BR': 'pt-BR',
	'en-US': 'en-US',
	'es-ES': 'es-ES',
};

// ------------------ GET NESTED SEGURO ------------------
function getNestedSafe<TObj extends object, TPath extends string>(
	obj: TObj,
	path: TPath,
): string | string[] | undefined {
	const value = path.split('#').reduce<unknown>((acc, key) => {
		if (acc && typeof acc === 'object' && key in acc) {
			return (acc as Record<string, unknown>)[key];
		}
		return undefined;
	}, obj);

	if (typeof value === 'string' || Array.isArray(value)) return value;
	if (value === undefined) return undefined;
	return JSON.stringify(value); // Se for objeto, transforma em string
}

// ------------------ PLACEHOLDERS ------------------
function replacePlaceholders(text: string, variables?: Variables): string {
	if (!variables) return text;
	return text.replace(/%(\w+)%/g, (_, key) =>
		variables[key] !== undefined ? String(variables[key]) : `%${key}%`,
	);
}

// ------------------ FUNÇÃO PRINCIPAL ------------------
export function replyLang<T extends typeof ptBRSchema, K extends NestedKeys<T>>(
	locale: Locale,
	key: K,
	variables?: Variables,
): string {
	const mappedLocale = localeMap[locale] ?? 'en-US';
	const rawText =
		// @ts-expect-error is correct
		getNestedSafe(languages[mappedLocale], key) ??
		getNestedSafe(languages['en-US'], key);

	if (!rawText) return `%${key}%`;

	const text = Array.isArray(rawText) ? rawText.join('\n') : rawText;

	return replacePlaceholders(text, variables);
}
