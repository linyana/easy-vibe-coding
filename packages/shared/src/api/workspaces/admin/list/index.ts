import { z } from 'zod';
import { workspaceListResponseSchema } from '../../list';

// Admin-only: all workspaces, paginated — the platform surface (the user's
// own list endpoint is membership-scoped and unpaginated). Search hits slug
// and name; the response shape reuses the workspace list contract.
export const workspaceAdminListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
});
export type WorkspaceAdminListQuery = z.infer<
	typeof workspaceAdminListQuerySchema
>;

export type WorkspaceAdminListResponse = z.infer<
	typeof workspaceListResponseSchema
>;
