import { logger } from '@fx/utils/logger.js';
import type { KoxikClient } from '@basedir/discord/client/bot/CustomClient.js';
import { checkEndedGiveaways } from '@app/discord/commands/moderation/giveaway.js';

const CHECK_INTERVAL_MS = 30_000;

export async function startGiveawayWorker(client: KoxikClient) {
	console.log('[GIVEAWAY WORKER] Starting giveaway worker...');
	logger.info('Starting giveaway worker...');

	await checkEndedGiveaways(client);

	const interval = setInterval(async () => {
		try {
			await checkEndedGiveaways(client);
		} catch (error) {
			console.error('[GIVEAWAY WORKER] Error in interval:', error);
			logger.error('Error in giveaway worker:', error);
		}
	}, CHECK_INTERVAL_MS);

	return () => {
		clearInterval(interval);
		console.log('[GIVEAWAY WORKER] Stopping giveaway worker...');
		logger.info('Stopping giveaway worker...');
	};
}
