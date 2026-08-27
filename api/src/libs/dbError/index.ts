import postgres from 'postgres';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

// Drizzle wraps driver errors — walk the (bounded) cause chain.
function hasPgCode(error: unknown, code: string): boolean {
	let current: unknown = error;
	for (
		let depth = 0;
		depth < 4 && current !== null && typeof current === 'object';
		depth++
	) {
		if (
			current instanceof postgres.PostgresError &&
			current.code === code
		) {
			return true;
		}
		current = (current as { cause?: unknown }).cause;
	}
	return false;
}

export function isUniqueViolation(error: unknown): boolean {
	return hasPgCode(error, UNIQUE_VIOLATION);
}

export function isForeignKeyViolation(error: unknown): boolean {
	return hasPgCode(error, FOREIGN_KEY_VIOLATION);
}
