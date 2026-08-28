import { z } from 'zod';

export const workspaceFieldSchemas = {
	name: z.string().trim().min(1, 'Name is required').max(100),
};

export const workspaceResponseSchema = z.object({
	// Stable public identifier — set once at create (derived from the name),
	// immutable while the display name can change. URLs and API paths use it;
	// the internal numeric id never appears on the wire.
	slug: z.string().min(1).max(100),
	name: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;

// The acting user's role in a workspace — the wire carries it on list items
// and detail so the UI can gate owner-only actions without a second fetch.
export const workspaceRoleSchema = z.enum(['owner', 'member']);
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

export const workspaceWithRoleSchema = workspaceResponseSchema.extend({
	// null for admins viewing a workspace they don't belong to (admin bypass).
	role: workspaceRoleSchema.nullable(),
});
export type WorkspaceWithRole = z.infer<typeof workspaceWithRoleSchema>;

export const workspaceSlugParamsSchema = z.object({
	workspaceSlug: z.string().trim().min(1).max(100),
});
export type WorkspaceSlugParams = z.infer<typeof workspaceSlugParamsSchema>;

// A membership projected onto its user — workspace_members ⋈ users.
export const workspaceMemberResponseSchema = z.object({
	userId: z.number(),
	role: workspaceRoleSchema,
	name: z.string(),
	email: z.string(),
	joinedAt: z.iso.datetime(),
});
export type WorkspaceMemberResponse = z.infer<
	typeof workspaceMemberResponseSchema
>;

export const workspaceMemberParamsSchema = z.object({
	workspaceSlug: z.string().trim().min(1).max(100),
	userId: z.coerce.number().int(),
});
export type WorkspaceMemberParams = z.infer<typeof workspaceMemberParamsSchema>;
