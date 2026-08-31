import { z } from 'zod';
import { platformSchema } from '../shared';

// Flat by design — the form edits these fields directly and the service packs
// the platform-specific pair into the `config` JSONB. The cross-field rule
// (shopUrl for shopify, storeHash for bigcommerce) lives here, one place.
export const connectionFieldSchemas = {
	name: z.string().trim().min(1, 'Name is required').max(100),
	platform: platformSchema,
	shopUrl: z.string().trim().optional(),
	storeHash: z.string().trim().optional(),
	accessToken: z.string().trim().min(1, 'Access token is required'),
};

export const connectionCreateSchema = z
	.object(connectionFieldSchemas)
	.superRefine((data, ctx) => {
		if (data.platform === 'shopify' && !data.shopUrl) {
			ctx.addIssue({
				code: 'custom',
				path: ['shopUrl'],
				message: 'Shop URL is required for Shopify',
			});
		}
		if (data.platform === 'bigcommerce' && !data.storeHash) {
			ctx.addIssue({
				code: 'custom',
				path: ['storeHash'],
				message: 'Store hash is required for BigCommerce',
			});
		}
	});
export type ConnectionCreate = z.infer<typeof connectionCreateSchema>;
