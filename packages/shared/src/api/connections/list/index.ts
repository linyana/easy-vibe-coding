import { z } from 'zod';
import { connectionResponseSchema, platformSchema } from '../shared';

export const connectionListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
	// One page per platform (Shopify / BigCommerce sub-nav) — the filter runs
	// server-side so pagination and search never cross platforms.
	platform: platformSchema.optional().catch(undefined),
});
export type ConnectionListQuery = z.infer<typeof connectionListQuerySchema>;

export const connectionListResponseSchema = z.object({
	items: z.array(connectionResponseSchema),
	total: z.number(),
});
export type ConnectionListResponse = z.infer<
	typeof connectionListResponseSchema
>;
