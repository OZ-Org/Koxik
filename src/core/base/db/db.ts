import { env } from '@env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas.js';

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: 10,
	idleTimeoutMillis: 10000,
	keepAlive: true
});

pool.on('error', (err) => {
	console.error('[DB] conexão morreu aeh:', err);
});

export const db = drizzle(pool, { schema });
