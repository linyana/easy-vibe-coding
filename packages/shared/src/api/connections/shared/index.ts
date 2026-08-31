import { z } from 'zod';

// The platform vocabulary — the connection row is bound to one platform at
// creation; edit never changes it (a platform switch means a new connection).
export const platformSchema = z.enum(['shopify', 'bigcommerce']);
export type Platform = z.infer<typeof platformSchema>;

// Platform-specific config, stored as JSONB on the row and echoed on the wire
// (nothing secret lives here — the access token has its own encrypted column
// and is never serialized; the response only carries `hasToken`).
export const connectionConfigSchema = z.union([
	z.object({ shopUrl: z.string() }),
	z.object({ storeHash: z.string() }),
]);
export type ConnectionConfig = z.infer<typeof connectionConfigSchema>;

export const connectionResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	platform: platformSchema,
	config: connectionConfigSchema,
	// The token never crosses the wire — this flag is all the UI sees.
	hasToken: z.boolean(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type ConnectionResponse = z.infer<typeof connectionResponseSchema>;

// Reused by edit / delete / products — `GET /connections/:id/products`
// addresses a connection by id, not by platform.
export const connectionIdParamsSchema = z.object({
	id: z.coerce.number().int(),
});
export type ConnectionIdParams = z.infer<typeof connectionIdParamsSchema>;
