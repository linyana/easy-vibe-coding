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

// Path params for member endpoints: the workspace id + the member's account id.
export const workspaceMemberParamsSchema = z.object({
	id: z.coerce.number().int(),
	accountId: z.coerce.number().int(),
});
export type WorkspaceMemberParams = z.infer<typeof workspaceMemberParamsSchema>;
