import { dev } from '$app/environment';
import type { HandleClientError } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';
import { logError } from '$lib/utils/logger';

// Same dev guard as the GCP logging module — don't send telemetry from local dev by default.
Sentry.init({
	dsn: import.meta.env.VITE_SENTRY_DSN,
	enabled: !dev && Boolean(import.meta.env.VITE_SENTRY_DSN),
	tracesSampleRate: 0.2,
	integrations: [Sentry.replayIntegration()],
	// Replay 10% of all sessions, but 100% of any session that actually hits an error —
	// keeps free-tier replay quota mostly spent on the sessions worth watching.
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0
});

// Catches errors from Svelte's own load/rendering error boundary. Composed with Sentry's
// wrapper rather than replaced by it — this keeps forwarding to Cloud Logging (unified with
// BE logs) *and* reports to Sentry (readable stack traces, session replay, impact alerts).
const handleGcpLogging: HandleClientError = ({ error, event, status, message }) => {
	logError(error, { status, message, routeId: event.route.id });
	return { message: 'An unexpected error occurred.' };
};

export const handleError = Sentry.handleErrorWithSentry(handleGcpLogging);

// Catches everything outside that boundary — thrown errors and rejected promises that
// nothing else handled.
if (typeof window !== 'undefined') {
	window.addEventListener('error', (event) => {
		logError(event.error ?? event.message, { source: 'window.onerror' });
	});

	window.addEventListener('unhandledrejection', (event) => {
		logError(event.reason, { source: 'unhandledrejection' });
	});
}
