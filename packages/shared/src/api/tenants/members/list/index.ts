import { z } from 'zod';
import { tenantMemberResponseSchema } from '../../shared';

export const tenantMembersListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
});
export type TenantMembersListQuery = z.infer<
	typeof tenantMembersListQuerySchema
>;

export const tenantMembersListResponseSchema = z.object({
	items: z.array(tenantMemberResponseSchema),
	total: z.number(),
});
export type TenantMembersListResponse = z.infer<
	typeof tenantMembersListResponseSchema
>;
