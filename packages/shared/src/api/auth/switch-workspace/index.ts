import { z } from 'zod';
import { workspaceFieldSchemas } from '../../workspaces/create';
import { workspaceRefSchema } from '../../workspaces/shared';

// Exchange the session for a workspace-scoped token: the response token
// carries accountId + workspaceId claims, and the workspace ref the store
// keeps. Membership is verified server-side by slug.
export const switchWorkspaceSchema = z.object({
	slug: workspaceFieldSchemas.slug,
});
export type SwitchWorkspace = z.infer<typeof switchWorkspaceSchema>;

export const switchWorkspaceResponseSchema = z.object({
	token: z.string(),
	workspace: workspaceRefSchema,
});
export type SwitchWorkspaceResponse = z.infer<
	typeof switchWorkspaceResponseSchema
>;
