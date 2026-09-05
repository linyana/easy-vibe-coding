import { lookup } from 'node:dns/promises';
import {
	LLM_PRESETS,
	type LlmApiKind,
	type LlmPresetId,
} from '@easy-vibe-coding/shared';

// The built-in preset registry (shared) is the provider vocab — nothing
// mirrors it here. Rows store the resolved api/name/baseUrl at creation, so
// registry edits never mutate stored rows; presets are only consulted when
// creating (to fill defaults) and never at read time.
export const presetById = (id: LlmPresetId) =>
	LLM_PRESETS.find((p) => p.id === id);

// ---------------------------------------------------------------------------
// Live model fetch (POST /llm/:id/models). The user's key goes to the user's
// chosen baseUrl through the server — that is an SSRF surface by design, so
// the host must resolve to a PUBLIC address only (loopback, RFC1918,
// link-local, CGNAT, ULA, multicast and friends are refused). Local/dev
// endpoints (ollama etc.) are out of scope here until an allowlist exists.
// ---------------------------------------------------------------------------

const isPrivateIPv4 = (ip: string) => {
	const parts = ip.split('.').map(Number);
	if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
	const a = parts[0]!;
	const b = parts[1]!;
	if (a === 0) return true; // "this network"
	if (a === 10) return true; // 10/8
	if (a === 127) return true; // loopback
	if (a === 169 && b === 254) return true; // link-local
	if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
	if (a === 192 && b === 168) return true; // 192.168/16
	if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
	if (a >= 224) return true; // multicast + reserved
	return false;
};

const isPrivateIPv6 = (ip: string) => {
	const lower = ip.toLowerCase();
	if (lower === '::' || lower === '::1') return true;
	const group = lower.split(':')[0];
	if (group === 'fc' || group === 'fd') return true; // fc00::/7 ULA
	if (
		lower.startsWith('fe8') ||
		lower.startsWith('fe9') ||
		lower.startsWith('fea') ||
		lower.startsWith('feb')
	)
		return true; // fe80::/10
	if (group === 'ff') return true; // multicast
	// IPv4-mapped (::ffff:a.b.c.d) — classify the embedded address.
	const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
	if (mapped) return isPrivateIPv4(mapped[1]!);
	return false;
};

const assertPublicHost = async (hostname: string) => {
	let records: { address: string }[];
	try {
		records = await lookup(hostname, { all: true });
	} catch {
		throw new Error(`Could not reach ${hostname} (DNS)`);
	}
	if (records.length === 0) {
		throw new Error(`Could not resolve ${hostname}`);
	}
	for (const { address } of records) {
		const blocked = address.includes(':')
			? isPrivateIPv6(address)
			: isPrivateIPv4(address);
		if (blocked) {
			throw new Error(
				`Refusing to reach ${hostname}: it resolves to a private/local address`,
			);
		}
	}
};

const isOpenAIFamily = (api: LlmApiKind) =>
	api === 'openai-completions' || api === 'openai-responses';

export { isOpenAIFamily };

export async function fetchModelsFromProvider({
	baseUrl,
	apiKey,
}: {
	baseUrl: string;
	apiKey: string;
}): Promise<{ id: string }[]> {
	let url: URL;
	try {
		url = new URL(`${baseUrl.replace(/\/+$/, '')}/models`);
	} catch {
		throw new Error('Base URL is not a valid URL');
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error('Base URL must use http:// or https://');
	}

	await assertPublicHost(url.hostname);

	let response: Response;
	try {
		response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				Accept: 'application/json',
			},
			// Guard the request itself; redirects would re-enter the SSRF
			// surface unchecked, so they fail loudly instead.
			redirect: 'error',
			signal: AbortSignal.timeout(12_000),
		});
	} catch {
		throw new Error('Could not reach the provider (network or timeout)');
	}

	if (response.status === 401 || response.status === 403) {
		throw new Error('The provider rejected the API key (401/403)');
	}
	if (!response.ok) {
		throw new Error(`The provider responded with HTTP ${response.status}`);
	}

	const body = (await response.json().catch(() => null)) as {
		data?: unknown;
	} | null;
	const raw = body?.data;
	if (!Array.isArray(raw)) {
		throw new Error('The provider returned an unexpected model list');
	}

	const seen = new Set<string>();
	for (const entry of raw) {
		const id =
			entry && typeof entry === 'object' && 'id' in entry
				? (entry as { id: unknown }).id
				: undefined;
		if (typeof id === 'string' && id.trim() && !seen.has(id)) seen.add(id);
	}
	return [...seen]
		.sort((a, b) => a.localeCompare(b))
		.slice(0, 500)
		.map((id) => ({ id }));
}
