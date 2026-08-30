import { z } from 'zod';
import { workspaceFieldSchemas } from '../../workspaces/create';

// Exchange the session for a workspace-scoped token: the response token
// carries accountId + workspaceSlug claims, and the workspace ref the store
// keeps. Membership is verified server-side by slug.
export const switchWorkspaceSchema = z.object({
	slug: workspaceFieldSchemas.slug,
});
export type SwitchWorkspace = z.infer<typeof switchWorkspaceSchema>;

export const switchWorkspaceResponseSchema = z.object({
	token: z.string(),
	workspace: z.object({
		slug: z.string(),
		name: z.string(),
	}),
});
export type SwitchWorkspaceResponse = z.infer<
	typeof switchWorkspaceResponseSchema
>;
