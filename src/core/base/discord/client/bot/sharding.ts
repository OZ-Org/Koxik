import os from 'node:os';
import { type ChildProcess, spawn } from 'node:child_process';
import type { ShardingConfig } from './types.js';

const children: ChildProcess[] = [];

export function setupSharding() {
	if (process.env.KOXIK_SHARD === 'true') return;

	const total = Number(process.env.SHARD_COUNT) || os.cpus().length;
	if (total <= 1) return;

	const entry = process.argv[1];
	if (!entry) throw new Error('[Koxik] Entry file not found');

	console.log(`[Koxik] Master spawning ${total} shards...`);

	const globalLocks = new Set<string>();

	for (let i = 0; i < total; i++) {
		const child = spawn('bun', ['run', entry, ...process.argv.slice(2)], {
			env: {
				...process.env,
				KOXIK_SHARD: 'true',
				SHARD_ID: String(i),
				SHARD_COUNT: String(total),
			},
			stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
		});

		children.push(child);

		console.log(`[Koxik] Shard ${i} started (pid: ${child.pid})`);

		child.on('message', (msg: any) => {
			if (msg.type === 'CHECK_INTERACTION') {
				const exists = globalLocks.has(msg.id);

				if (!exists) globalLocks.add(msg.id);

				child.send?.({
					type: 'CHECK_RESULT',
					id: msg.id,
					allowed: !exists,
				});
			}
		});
	}

	console.log('[Koxik] Master done. Waiting shards...');

	process.on('SIGINT', () => {
		console.log('\n[Koxik] Killing shards...');

		for (const child of children) {
			child.kill('SIGINT');
		}

		process.exit(0);
	});

	return true;
}

export function getShardData() {
	const isPM2Cluster =
		process.env.KOXIK_PM2_SHARD === 'true' || process.env.pm_id !== undefined;

	const shardId = process.env.SHARD_ID
		? Number(process.env.SHARD_ID)
		: process.env.NODE_APP_INSTANCE
			? Number(process.env.NODE_APP_INSTANCE)
			: undefined;

	const shardCount = process.env.SHARD_COUNT
		? Number(process.env.SHARD_COUNT)
		: process.env.KOXIK_INSTANCES
			? Number(process.env.KOXIK_INSTANCES)
			: undefined;

	const isMainShard = shardId === undefined || shardId === 0;

	return {
		shardId,
		shardCount,
		isMainShard,
		isSharded: shardId !== undefined,
		isPM2Cluster,
	};
}

export function resolveSharding(configs: ShardingConfig[]): ShardingConfig {
	const envNow = process.env.NODE_ENV ?? 'development';

	for (const cfg of configs) {
		if (!cfg.env || cfg.env === envNow) {
			return cfg;
		}
	}

	return { type: 'Disabled' };
}

export function applySharding(config: ShardingConfig) {
	switch (config.type) {
		case 'Disabled':
			console.log('[Koxik] Sharding disabled');
			return;

		case 'Internal': {
			const count = config.count === 'auto' ? os.cpus().length : config.count;

			process.env.SHARD_COUNT = String(count);

			console.log(`[Koxik] Internal sharding → ${count} shards`);

			setupSharding();
			break;
		}

		case 'PM2': {
			console.log('[Koxik] PM2 mode detected (external)');
			break;
		}
	}
}
