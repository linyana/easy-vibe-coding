import { z } from 'zod';

// A workspace member = the account row joined with its membership role. The
// workspace context comes from the token's workspaceSlug claim — never a param.
export const memberResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string(),
	role: z.string(),
	joinedAt: z.iso.datetime(),
});
export type MemberResponse = z.infer<typeof memberResponseSchema>;
