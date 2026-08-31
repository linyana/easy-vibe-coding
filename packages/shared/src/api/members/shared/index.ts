import { z } from 'zod';

// The role vocabulary — server-written on create ('owner'), admin-managed
// afterwards. Tightening the wire type makes a stray role a compile error.
export const memberRoleSchema = z.enum(['owner', 'member']);
export type MemberRole = z.infer<typeof memberRoleSchema>;

// A workspace member = the account row joined with its membership role. The
// workspace context comes from the token's workspaceId claim — never a param.
export const memberResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string(),
	role: memberRoleSchema,
	joinedAt: z.iso.datetime(),
});
export type MemberResponse = z.infer<typeof memberResponseSchema>;
