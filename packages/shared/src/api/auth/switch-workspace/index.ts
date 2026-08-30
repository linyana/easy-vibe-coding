import { z } from 'zod';

// Exchange the session for a workspace-scoped token: the response token
// carries both accountId and workspaceId claims. Membership is verified
// server-side — the account must be a member of the workspace it asks for.
export const switchWorkspaceSchema = z.object({
	workspaceId: z.number().int(),
});
export type SwitchWorkspace = z.infer<typeof switchWorkspaceSchema>;

export const switchWorkspaceResponseSchema = z.object({
	token: z.string(),
});
export type SwitchWorkspaceResponse = z.infer<
	typeof switchWorkspaceResponseSchema
>;
