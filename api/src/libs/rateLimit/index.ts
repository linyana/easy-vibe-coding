import { Errors } from '../error';

// In-memory fixed-window limiter (single-process scope; keyed on socket
// addresses — behind a reverse proxy this sees the proxy's IP, not the real
// client's). Fixed windows let ≤ 2×max burst through at the boundary —
// acceptable, every gated attempt already costs an argon2id hash/verify.

export interface RateLimiter {
	consume: (key: string) => void;
}

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 5;
const DEFAULT_MESSAGE = 'Too many attempts. Please try again later.';

export function createRateLimiter(options?: {
	windowMs?: number;
	max?: number;
	message?: string;
}): RateLimiter {
	const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
	const max = options?.max ?? DEFAULT_MAX;
	const message = options?.message ?? DEFAULT_MESSAGE;
	const buckets = new Map<string, { count: number; resetAt: number }>();

	// Sweep expired entries on a timer (unref'd — never keeps the process
	// alive) so a high-cardinality key space can't grow the map without bound.
	const sweep = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of buckets) {
			if (now >= entry.resetAt) buckets.delete(key);
		}
	}, windowMs);
	sweep.unref?.();

	return {
		consume(key: string) {
			const now = Date.now();
			const entry = buckets.get(key);
			if (!entry || now >= entry.resetAt) {
				buckets.set(key, { count: 1, resetAt: now + windowMs });
				return;
			}
			entry.count += 1;
			if (entry.count > max) {
				throw Errors.tooManyRequests(message);
			}
		},
	};
}
