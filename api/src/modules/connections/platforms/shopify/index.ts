import type { ConnectionConfig } from '@easy-vibe-coding/shared';
import { Errors } from '../../../../libs/error';
import { externalFetch } from '../http';
import type { FetchProductsResult, PlatformClient } from '../types';

const ADMIN_API_VERSION = '2024-10';
const PAGE_LIMIT = 50;

interface ShopifyProduct {
	id: number;
	title: string;
	status: string;
	handle: string;
	variants?: { price?: string }[];
}

interface ShopifyProductsPayload {
	products: ShopifyProduct[];
}

// Shopify Admin API — auth is a per-store Admin API access token
// (X-Shopify-Access-Token) against the store's own domain. Price lives on the
// first variant (plain products have exactly one).
export const shopifyClient: PlatformClient = {
	async fetchProducts(
		config: ConnectionConfig,
		accessToken: string,
	): Promise<FetchProductsResult> {
		if (!('shopUrl' in config)) {
			throw Errors.badRequest(
				'Shopify connection is missing its shop URL',
			);
		}
		const url = `https://${config.shopUrl}/admin/api/${ADMIN_API_VERSION}/products.json?limit=${PAGE_LIMIT}`;
		const payload = (await externalFetch(url, {
			'X-Shopify-Access-Token': accessToken,
			'Content-Type': 'application/json',
		})) as ShopifyProductsPayload;

		const items = (payload.products ?? []).map((product) => ({
			id: String(product.id),
			title: product.title,
			price: product.variants?.[0]?.price ?? '0',
			status: product.status,
			url: `https://${config.shopUrl}/products/${product.handle}`,
		}));
		// One fixed page — a full page means more is likely (the Admin API
		// cursor would be the pagination upgrade, out of scope for v1).
		return { items, hasMore: items.length >= PAGE_LIMIT };
	},

	async testConnection(
		config: ConnectionConfig,
		accessToken: string,
	): Promise<void> {
		if (!('shopUrl' in config)) {
			throw Errors.badRequest(
				'Shopify connection is missing its shop URL',
			);
		}
		// shop.json — the lightest authenticated call the Admin API offers;
		// any 2xx means the token is live and has read access.
		const url = `https://${config.shopUrl}/admin/api/${ADMIN_API_VERSION}/shop.json`;
		await externalFetch(url, {
			'X-Shopify-Access-Token': accessToken,
			'Content-Type': 'application/json',
		});
	},
};
