import postgres from 'postgres';

const UNIQUE_VIOLATION = '23505';

// Drizzle wraps driver errors — walk the (bounded) cause chain.
export function isUniqueViolation(error: unknown): boolean {
	let current: unknown = error;
	for (
		let depth = 0;
		depth < 4 && current !== null && typeof current === 'object';
		depth++
	) {
		if (
			current instanceof postgres.PostgresError &&
			current.code === UNIQUE_VIOLATION
		) {
			return true;
		}
		current = (current as { cause?: unknown }).cause;
	}
	return false;
}
