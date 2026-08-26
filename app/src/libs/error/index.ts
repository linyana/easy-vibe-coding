import {
	ERROR_DEFAULTS,
	type ErrorCode as ServerErrorCode,
	type ErrorField,
} from '@easy-vibe-coding/shared';

export type { ErrorField } from '@easy-vibe-coding/shared';

// Every failure (server, validation, network) surfaces in this one shape;
// NETWORK/UNKNOWN are client-side additions.

export type ErrorCode = ServerErrorCode | 'NETWORK' | 'UNKNOWN';

export type UseAPIError = {
	/** HTTP status (0 = the request never reached the server) */
	status: number;
	code: ErrorCode;
	message: string;
	fields?: ErrorField[];
};

const NETWORK_ERROR: UseAPIError = {
	status: 0,
	code: 'NETWORK',
	message: 'Unable to reach the server. Please check your connection.',
};

// Fallback when the wire body omits a message — defaults come from the shared
// ERROR_DEFAULTS (one source of truth).
function defaultMessage(code: ErrorCode): string {
	if (code in ERROR_DEFAULTS)
		return ERROR_DEFAULTS[code as ServerErrorCode].message;
	return 'An unknown error occurred';
}

export function parseEdenError(error: {
	status?: unknown;
	value?: unknown;
}): UseAPIError {
	const status = typeof error.status === 'number' ? error.status : 0;
	const value = error.value;

	// Network-level failure: fetch threw (Eden wraps it as a 503 whose `value`
	// is the original TypeError) or there was no response at all.
	if (value === undefined || value instanceof TypeError) {
		return { ...NETWORK_ERROR, status };
	}

	if (value && typeof value === 'object' && 'message' in value) {
		const body = value as Partial<{
			code: ErrorCode;
			message: string;
			fields?: ErrorField[];
		}>;
		return {
			status,
			code: body.code ?? 'UNKNOWN',
			message:
				typeof body.message === 'string' && body.message
					? body.message
					: defaultMessage(body.code ?? 'UNKNOWN'),
			fields: body.fields,
		};
	}

	if (typeof value === 'string' && value) {
		return { status, code: 'UNKNOWN', message: value };
	}

	return { status, code: 'UNKNOWN', message: 'An unknown error occurred' };
}

/** Retryable when a retry can plausibly succeed: network (status 0) and 5xx — not 4xx. */
export function isRetryableError(error: Pick<UseAPIError, 'status'>): boolean {
	return error.status === 0 || error.status >= 500;
}
