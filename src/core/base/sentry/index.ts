import * as Sentry from '@sentry/bun';
import { env } from '@env';
import { logger } from '@fx/utils/logger.js';

/**
 * Initialize Sentry error tracking if DSN is configured
 * @returns true if Sentry was initialized, false otherwise
 */
export function initSentry(): boolean {
	if (!env.SENTRY_DSN) {
		logger.debug('Sentry DSN not set — skipping initialization');
		return false;
	}

	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.NODE_ENV,
		tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
		beforeSend(event) {
			if (
				event.exception?.values?.some((exc) =>
					exc.value?.includes('Unknown Interaction'),
				)
			) {
				return null;
			}
			return event;
		},
	});

	logger.success(`Sentry initialized (env: ${env.NODE_ENV})`);
	return true;
}

/**
 * Capture error with context information
 * @param error The error to capture
 * @param context Additional context to attach to the error
 */
export function captureError(
	error: unknown,
	context?: Record<string, unknown>,
): void {
	Sentry.withScope((scope) => {
		if (context) {
			scope.setContext('error_context', context);
		}
		Sentry.captureException(error);
	});
}

export { Sentry };
