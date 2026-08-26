// The wire shape of every failure — the app adds client-side NETWORK/UNKNOWN codes.

export type ErrorCode =
	| 'BAD_REQUEST'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'VALIDATION'
	| 'TOO_MANY_REQUESTS'
	| 'INTERNAL';

export interface ErrorField {
	field: string;
	message: string;
}

export interface ErrorBody {
	code: ErrorCode;
	message: string;
	fields?: ErrorField[];
}

// One place defining each code's status + message — adding a code = one edit.
export const ERROR_DEFAULTS: Record<
	ErrorCode,
	{ status: number; message: string }
> = {
	BAD_REQUEST: { status: 400, message: 'Bad request' },
	UNAUTHORIZED: { status: 401, message: 'Unauthorized' },
	FORBIDDEN: { status: 403, message: 'Forbidden' },
	NOT_FOUND: { status: 404, message: 'Not found' },
	CONFLICT: { status: 409, message: 'Conflict' },
	VALIDATION: { status: 422, message: 'Validation failed' },
	TOO_MANY_REQUESTS: { status: 429, message: 'Too many requests' },
	INTERNAL: { status: 500, message: 'Internal server error' },
};
