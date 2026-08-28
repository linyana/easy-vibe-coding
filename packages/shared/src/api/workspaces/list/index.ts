import { z } from 'zod';
import { workspaceWithRoleSchema } from '../shared';

// "My workspaces" — membership-scoped server-side; page/search mirror the
// canonical list shape.
export const workspaceListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
});
export type WorkspaceListQuery = z.infer<typeof workspaceListQuerySchema>;

export const workspaceListResponseSchema = z.object({
	items: z.array(workspaceWithRoleSchema),
	total: z.number(),
});
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;
