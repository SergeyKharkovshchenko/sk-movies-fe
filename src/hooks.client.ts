import type { HandleClientError } from '@sveltejs/kit';
import { logError } from '$lib/utils/logger';

// Catches errors from Svelte's own load/rendering error boundary.
export const handleError: HandleClientError = ({ error, event, status, message }) => {
	logError(error, { status, message, routeId: event.route.id });
	return { message: 'An unexpected error occurred.' };
};

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
