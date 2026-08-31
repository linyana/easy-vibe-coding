import type { ConnectionConfig } from '@easy-vibe-coding/shared';

// The normalized product shape across platforms — the wire contract's
// productResponseSchema is the same fields.
export interface NormalizedProduct {
	id: string;
	title: string;
	price: string;
	status: string;
	url?: string;
}

export interface FetchProductsResult {
	items: NormalizedProduct[];
	hasMore: boolean;
}

// One platform client owns only its protocol details (URL, auth headers,
// payload parsing, pagination marker). Error mapping, timeouts, and retry
// policy live in the shared `externalFetch` — never duplicated per platform.
export interface PlatformClient {
	fetchProducts(
		config: ConnectionConfig,
		accessToken: string,
	): Promise<FetchProductsResult>;
	/** Cheap credential check — one small API call. Throws via externalFetch
	 *  (unified error mapping) on failure; resolves on any 2xx. */
	testConnection(
		config: ConnectionConfig,
		accessToken: string,
	): Promise<void>;
}
