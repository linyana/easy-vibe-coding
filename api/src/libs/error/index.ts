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

	if (code === 'NOT_FOUND') {
		return {
			status: 404,
			body: { code: 'NOT_FOUND', message: 'Route not found' },
		};
	}

	console.error('[unhandled error]', error);
	return {
		status: 500,
		body: { code: 'INTERNAL', message: 'Internal server error' },
	};
}
