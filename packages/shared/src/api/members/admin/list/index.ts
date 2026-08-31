import { z } from 'zod';

// GET /admin/workspaces/members — the admin roster of the entered workspace,
// paginated + searchable (the platform list pattern; the user-facing /members
// roster is unpaginated). The response reuses memberListResponseSchema
// ({ items, total }); search hits the member's name and email.
export const memberAdminListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
});
export type MemberAdminListQuery = z.infer<typeof memberAdminListQuerySchema>;
