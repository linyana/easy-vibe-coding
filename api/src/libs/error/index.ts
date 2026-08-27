import { ValidationError } from 'elysia';
import { ERROR_DEFAULTS } from '@easy-vibe-coding/shared';
import type {
	ErrorBody,
	ErrorCode,
	ErrorField,
} from '@easy-vibe-coding/shared';

export type {
	ErrorBody,
	ErrorCode,
	ErrorField,
} from '@easy-vibe-coding/shared';

export interface ApiErrorOptions {
	status?: number;
	code?: ErrorCode;
	message?: string;
	fields?: ErrorField[];
}

export class ApiError extends Error {
	readonly status: number;
	readonly code: ErrorCode;
	readonly fields?: ErrorField[];

	constructor(options: ApiErrorOptions = {}) {
		const { code = 'INTERNAL', status, message, fields } = options;
		const defaults = ERROR_DEFAULTS[code];
		super(message || defaults.message);
		this.name = 'ApiError';
		this.status = status ?? defaults.status;
		this.code = code;
		this.fields = fields;
	}
}

export const Errors = {
	badRequest: (message: string, fields?: ErrorField[]) =>
		new ApiError({ code: 'BAD_REQUEST', message, fields }),
	unauthorized: (message: string) =>
		new ApiError({ code: 'UNAUTHORIZED', message }),
	forbidden: (message: string) =>
		new ApiError({ code: 'FORBIDDEN', message }),
	notFound: (message: string) => new ApiError({ code: 'NOT_FOUND', message }),
	conflict: (message: string) => new ApiError({ code: 'CONFLICT', message }),
	tooManyRequests: (message: string) =>
		new ApiError({ code: 'TOO_MANY_REQUESTS', message }),
};

export interface NormalizedError {
	status: number;
	body: ErrorBody;
}

export function normalizeError(
	code: string | number,
	error: unknown,
): NormalizedError {
	if (error instanceof ApiError) {
		return {
			status: error.status,
			body: {
				code: error.code,
				message: error.message,
				fields: error.fields,
			},
		};
	}

	if (error instanceof ValidationError) {
		return {
			status: 422,
			body: {
				code: 'VALIDATION',
				message: 'Validation failed',
				fields: error.all.map(({ path, message }) => ({
					field: path,
					message,
				})),
			},
		};
	}

	// Framework-level codes Elysia hands to onError: every thrown value
	// resolves to one of these via `error.code ?? error[ERROR_CODE] ??
	// 'UNKNOWN'` (elysia 1.x compose.js). Keeping this a full Record forces
	// every known code to be explicitly classified — client-side ones get
	// translated into our wire shape instead of masquerading as 500s.
	type FrameworkCode =
		| 'PARSE'
		| 'INVALID_COOKIE_SIGNATURE'
		| 'INVALID_FILE_TYPE'
		| 'INTERNAL_SERVER_ERROR'
		| 'UNKNOWN'
		// Handled by instanceof checks above; listed here so the Record stays
		// exhaustive over the union.
		| 'VALIDATION'
		| 'NOT_FOUND';

	interface FrameworkMapping {
		status: number;
		code: ErrorCode;
		message: string;
		// True for genuinely unexpected failures: log them, stay a 500.
		log?: boolean;
	}

	const FRAMEWORK_ERRORS: Record<FrameworkCode, FrameworkMapping> = {
		// Client-side mistakes — fixed messages; never surface parser internals.
		PARSE: {
			status: 400,
			code: 'BAD_REQUEST',
			message: 'Malformed request body',
		},
		INVALID_COOKIE_SIGNATURE: {
			status: 400,
			code: 'BAD_REQUEST',
			message: 'Invalid signed cookie',
		},
		INVALID_FILE_TYPE: {
			status: 400,
			code: 'BAD_REQUEST',
			message: 'Unsupported file type',
		},
		NOT_FOUND: {
			status: 404,
			code: 'NOT_FOUND',
			message: 'Route not found',
		},
		VALIDATION: {
			status: 422,
			code: 'VALIDATION',
			message: 'Validation failed',
		},
		// Server-side / unrecognized — correctly a 500. Logging keeps these
		// visible; new framework codes introduced by an elysia upgrade land
		// here until classified above.
		INTERNAL_SERVER_ERROR: {
			status: 500,
			code: 'INTERNAL',
			message: 'Internal server error',
			log: true,
		},
		UNKNOWN: {
			status: 500,
			code: 'INTERNAL',
			message: 'Internal server error',
			log: true,
		},
	};

	const mapping =
		typeof code === 'string'
			? FRAMEWORK_ERRORS[code as FrameworkCode]
			: undefined;
	if (!mapping) {
		console.error('[unhandled error]', code, error);
		return {
			status: 500,
			body: { code: 'INTERNAL', message: 'Internal server error' },
		};
	}

	if (mapping.log) {
		console.error('[framework error]', code, error);
	}
	return {
		status: mapping.status,
		body: { code: mapping.code, message: mapping.message },
	};
}
