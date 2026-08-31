import { z } from 'zod';

// The normalized product shape — one shape across platforms. The caller holds
// the platform (from the connection), so display-side differences are gone.
export const productResponseSchema = z.object({
	id: z.string(),
	title: z.string(),
	price: z.string(),
	status: z.string(),
	url: z.string().optional(),
});
export type ProductResponse = z.infer<typeof productResponseSchema>;

// Live passthrough (no local storage): one page, fixed size — the connector
// surfaces `hasMore` and the UI decides whether pagination is worth building.
export const productListResponseSchema = z.object({
	items: z.array(productResponseSchema),
	hasMore: z.boolean(),
});
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
