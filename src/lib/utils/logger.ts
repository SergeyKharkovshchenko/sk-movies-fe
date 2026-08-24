import { browser } from '$app/environment';
import { FetchMethods, handleFetch } from './fetch';

const apiUrl = import.meta.env.VITE_API_URL;

export type LogSeverity =
	| 'DEBUG'
	| 'INFO'
	| 'NOTICE'
	| 'WARNING'
	| 'ERROR'
	| 'CRITICAL'
	| 'ALERT'
	| 'EMERGENCY';

export type StructuredLogPayload = {
	message: string;
	path?: string;
	url?: string;
	routeId?: string | null;
	traceId?: string;
	sessionCorrelationId?: string;
	status?: number;
	stack?: string;
	context?: Record<string, unknown>;
	severity?: LogSeverity;
};

// This app builds with adapter-static, so there's no server at runtime to hold Google
// credentials or an @google-cloud/logging client. All logs come from the browser and are
// forwarded to the BE's /logs endpoint, which does the actual write to Cloud Logging.

const SESSION_CORRELATION_KEY = 'sk-movies-session-correlation-id';

const ensureSessionCorrelationId = () => {
	if (!browser) return undefined;
	try {
		let id = sessionStorage.getItem(SESSION_CORRELATION_KEY);
		if (!id) {
			id = crypto.randomUUID();
			sessionStorage.setItem(SESSION_CORRELATION_KEY, id);
		}
		return id;
	} catch {
		return undefined;
	}
};

export const extractErrorDetails = (error: unknown) => {
	if (error instanceof Error) {
		return { message: error.message, stack: error.stack ?? undefined };
	}
	if (typeof error === 'string') {
		return { message: error };
	}
	return { message: 'Unknown error', stack: undefined };
};

export const logToServer = (payload: StructuredLogPayload) => {
	if (!browser) return;

	const body = {
		...payload,
		sessionCorrelationId: payload.sessionCorrelationId ?? ensureSessionCorrelationId(),
		url: payload.url ?? window.location.href,
		path: payload.path ?? window.location.pathname
	};

	// Fire-and-forget — a logging failure must never surface to the user.
	handleFetch(`${apiUrl}/logs`, FetchMethods.POST, {}, body);
};

export const logError = (error: unknown, context?: Record<string, unknown>) => {
	const { message, stack } = extractErrorDetails(error);
	logToServer({ message, stack, context, severity: 'ERROR' });
};
