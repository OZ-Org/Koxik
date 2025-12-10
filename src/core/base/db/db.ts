import { env } from '@env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schemas.js';

export const client = new Client({
	connectionString: env.DATABASE_URL,
});

// { schema } is used for relational queries
export const db = drizzle({ client, schema });
