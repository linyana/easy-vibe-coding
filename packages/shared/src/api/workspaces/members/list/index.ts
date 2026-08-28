import { z } from 'zod';
import { workspaceMemberResponseSchema } from '../../shared';

export const workspaceMembersListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
});
export type WorkspaceMembersListQuery = z.infer<
	typeof workspaceMembersListQuerySchema
>;

export const workspaceMembersListResponseSchema = z.object({
	items: z.array(workspaceMemberResponseSchema),
	total: z.number(),
});
export type WorkspaceMembersListResponse = z.infer<
	typeof workspaceMembersListResponseSchema
>;
