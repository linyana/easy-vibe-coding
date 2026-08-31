import { z } from 'zod';

export const workspaceResponseSchema = z.object({
	id: z.number(),
	slug: z.string(),
	name: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;

// The session-facing identity of a workspace: id is how server-scoped admin
// operations address it (admin members endpoint), slug is how the app refers
// to it, name is what it displays. Everything the store keeps about the
// current workspace fits in this ref.
export const workspaceRefSchema = z.object({
	id: z.number(),
	slug: z.string(),
	name: z.string(),
});
export type WorkspaceRef = z.infer<typeof workspaceRefSchema>;

// Path params for workspace-scoped admin routes (edit / delete / members).
export const workspaceIdParamsSchema = z.object({
	id: z.coerce.number().int(),
});
export type WorkspaceIdParams = z.infer<typeof workspaceIdParamsSchema>;
