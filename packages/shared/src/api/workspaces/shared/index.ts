import { z } from 'zod';

export const workspaceResponseSchema = z.object({
	id: z.number(),
	slug: z.string(),
	name: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;

// The session-facing identity of a workspace: slug is how the app refers to
// it, name is what it displays. Everything the store keeps about the current
// workspace fits in this ref.
export const workspaceRefSchema = z.object({
	slug: z.string(),
	name: z.string(),
});
export type WorkspaceRef = z.infer<typeof workspaceRefSchema>;
