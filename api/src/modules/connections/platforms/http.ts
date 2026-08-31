import { Errors } from '../../../libs/error';

const TIMEOUT_MS = 10_000;

// The one HTTP door to external platforms — every platform client goes
// through here, so error semantics stay identical across connectors:
//   - credentials rejected (401/403)  → BAD_REQUEST, actionable message
//   - rate-limited (429)              → TOO_MANY_REQUESTS (user retries)
//   - other non-2xx                   → BAD_REQUEST + short response excerpt
//   - timeout / unreachable           → BAD_REQUEST (never a custom INTERNAL)
// No automatic retry — consistent with "retry is user-initiated" (a live
// request answers the user's click; backoff loops belong to background syncs).
export async function externalFetch(
	url: string,
	headers: Record<string, string>,
): Promise<unknown> {
	let response: Response;
	try {
		response = await fetch(url, {
			headers,
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
	} catch (err) {
		if (err instanceof Error && err.name === 'TimeoutError') {
			throw Errors.badRequest('The platform timed out — try again later');
		}
		throw Errors.badRequest('Failed to reach the platform');
	}

	if (response.ok) {
		return response.json();
	}

	const detail = (await response.text().catch(() => '')).slice(0, 200);
	if (response.status === 401 || response.status === 403) {
		throw Errors.badRequest(
			'The platform rejected the credentials — update the access token',
		);
	}
	if (response.status === 429) {
		throw Errors.tooManyRequests(
			'The platform is rate-limiting — try again later',
		);
	}
	throw Errors.badRequest(
		`Platform error (HTTP ${response.status})${detail ? `: ${detail}` : ''}`,
	);
}
