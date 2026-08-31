import type { ConnectionConfig } from '@easy-vibe-coding/shared';
import { Errors } from '../../../../libs/error';
import { externalFetch } from '../http';
import type { FetchProductsResult, PlatformClient } from '../types';

const BASE_URL = 'https://api.bigcommerce.com';
const PAGE_LIMIT = 50;

interface BigCommerceProduct {
	id: number;
	name: string;
	price: string | number;
	status: string;
}

interface BigCommerceProductsPayload {
	data: BigCommerceProduct[];
	meta?: {
		pagination?: { current_page?: number; total_pages?: number };
	};
}

// BigCommerce Management API — auth is a store-level access token
// (X-Auth-Token) against the store hash. The V3 catalog returns real paging
// metadata, so `hasMore` is exact (unlike Shopify's page heuristic).
export const bigcommerceClient: PlatformClient = {
	async fetchProducts(
		config: ConnectionConfig,
		accessToken: string,
	): Promise<FetchProductsResult> {
		if (!('storeHash' in config)) {
			throw Errors.badRequest(
				'BigCommerce connection is missing its store hash',
			);
		}
		const url = `${BASE_URL}/stores/${config.storeHash}/v3/catalog/products?limit=${PAGE_LIMIT}`;
		const payload = (await externalFetch(url, {
			'X-Auth-Token': accessToken,
			Accept: 'application/json',
		})) as BigCommerceProductsPayload;

		const items = (payload.data ?? []).map((product) => ({
			id: String(product.id),
			title: product.name,
			price: String(product.price ?? '0'),
			status: product.status,
		}));
		const pagination = payload.meta?.pagination;
		const currentPage = pagination?.current_page ?? 1;
		const totalPages = pagination?.total_pages ?? 1;
		return { items, hasMore: currentPage < totalPages };
	},

	async testConnection(
		config: ConnectionConfig,
		accessToken: string,
	): Promise<void> {
		if (!('storeHash' in config)) {
			throw Errors.badRequest(
				'BigCommerce connection is missing its store hash',
			);
		}
		// /v2/store — the lightest authenticated call; any 2xx means the
		// token is live and scoped.
		const url = `${BASE_URL}/stores/${config.storeHash}/v2/store`;
		await externalFetch(url, {
			'X-Auth-Token': accessToken,
			Accept: 'application/json',
		});
	},
};
