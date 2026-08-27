import { z } from 'zod';
import { tenantWithRoleSchema } from '../shared';

// "My tenants" — membership-scoped server-side; page/search mirror the
// canonical list shape.
export const tenantListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
});
export type TenantListQuery = z.infer<typeof tenantListQuerySchema>;

export const tenantListResponseSchema = z.object({
	items: z.array(tenantWithRoleSchema),
	total: z.number(),
});
export type TenantListResponse = z.infer<typeof tenantListResponseSchema>;
