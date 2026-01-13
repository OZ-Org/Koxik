import { z } from 'zod/v4';

const envSchema = z.object({
	DISCORD_TOKEN: z.string(),
	DATABASE_URL: z.string(),
	NODE_ENV: z.enum(['development', 'production']),
	LOGS_WEBHOOK_URL: z.url(),
	TOPGG_TOKEN: z.string()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	throw new Error('Invalid environment variables');
}

export const env = parsed.data;
