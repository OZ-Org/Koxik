import { z } from 'zod/v4';

const envSchema = z.object({
	DISCORD_TOKEN: z.string(),
	DATABASE_URL: z.string(),
	NODE_ENV: z.enum(['development', 'production']),
	LOGS_WEBHOOK_URL: z.url(),
	TOPGG_TOKEN: z.string().optional(),
	DB_POOL_MAX: z.coerce.number().min(1).max(100).default(10),
	DB_POOL_IDLE_TIMEOUT: z.coerce.number().min(1000).default(10000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	throw new Error('Invalid environment variables');
}

export const env = parsed.data;
