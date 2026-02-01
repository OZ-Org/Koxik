import { env } from '@env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas.js';

export class DatabaseConnectionError extends Error {
	constructor(
		message: string,
		public readonly cause?: Error,
	) {
		super(message);
		this.name = 'DatabaseConnectionError';
	}
}

export class DatabaseQueryError extends Error {
	constructor(
		message: string,
		public readonly cause?: Error,
	) {
		super(message);
		this.name = 'DatabaseQueryError';
	}
}

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: 10,
	idleTimeoutMillis: 10000,
	keepAlive: true,
});

pool.on('error', (err) => {
	const error = new DatabaseConnectionError(
		'Database connection error occurred',
		err,
	);
	console.error('[DB] Connection error:', error);
});

export const db = drizzle(pool, { schema });

export async function checkDatabaseHealth(): Promise<boolean> {
	try {
		await pool.query('SELECT 1');
		return true;
	} catch (error) {
		const dbError = new DatabaseConnectionError(
			'Database health check failed',
			error as Error,
		);
		console.error('[DB] Health check failed:', dbError);
		return false;
	}
}

export async function getDatabaseStatus(): Promise<{
	healthy: boolean;
	totalCount: number;
	idleCount: number;
	waitingCount: number;
}> {
	try {
		const isHealthy = await checkDatabaseHealth();
		const { totalCount, idleCount, waitingCount } = pool;

		return {
			healthy: isHealthy,
			totalCount,
			idleCount,
			waitingCount,
		};
	} catch (_) {
		return {
			healthy: false,
			totalCount: 0,
			idleCount: 0,
			waitingCount: 0,
		};
	}
}
