import { z } from 'zod';
import { memberRoleSchema } from '../../../members/shared';

// Admin-only member management on a workspace: add by email (unique,
// case-insensitive — the account row is looked up by it), change role.
// The workspace keeps its invariant "no owner-less workspace" server-side.
export const workspaceMemberAddSchema = z.object({
	email: z.email('Please enter a valid email address'),
});
export type WorkspaceMemberAdd = z.infer<typeof workspaceMemberAddSchema>;

export const workspaceMemberRoleUpdateSchema = z.object({
	role: memberRoleSchema,
});
export type WorkspaceMemberRoleUpdate = z.infer<
	typeof workspaceMemberRoleUpdateSchema
>;

// Path params for member endpoints: only the member's account id — the
// workspace is NOT in the URL. It comes from the session: the adminWorkspace
// guard resolves the token's workspaceSlug claim into auth.workspaceId, so
// these routes can only address the workspace the admin entered.
export const workspaceMemberAccountParamsSchema = z.object({
	accountId: z.coerce.number().int(),
});
export type WorkspaceMemberAccountParams = z.infer<
	typeof workspaceMemberAccountParamsSchema
>;

// GET /workspaces/admin/members — the admin roster of the entered workspace,
// paginated + searchable (the platform list pattern). The response reuses
// memberListResponseSchema ({ items, total }); search hits the member's name
// and email.
export const workspaceMemberListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
});
export type WorkspaceMemberListQuery = z.infer<
	typeof workspaceMemberListQuerySchema
>;
