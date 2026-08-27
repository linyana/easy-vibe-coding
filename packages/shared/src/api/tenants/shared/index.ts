import { z } from 'zod';

export const tenantFieldSchemas = {
	name: z.string().trim().min(1, 'Name is required').max(100),
};

export const tenantResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type TenantResponse = z.infer<typeof tenantResponseSchema>;

// The acting user's role in a tenant — the wire carries it on list items and
// detail so the UI can gate owner-only actions without a second fetch.
export const tenantRoleSchema = z.enum(['owner', 'member']);
export type TenantRole = z.infer<typeof tenantRoleSchema>;

export const tenantWithRoleSchema = tenantResponseSchema.extend({
	// null for admins viewing a tenant they don't belong to (admin bypass).
	role: tenantRoleSchema.nullable(),
});
export type TenantWithRole = z.infer<typeof tenantWithRoleSchema>;

export const tenantIdParamsSchema = z.object({
	tenantId: z.coerce.number().int(),
});
export type TenantIdParams = z.infer<typeof tenantIdParamsSchema>;

// A membership projected onto its user — tenant_members ⋈ users.
export const tenantMemberResponseSchema = z.object({
	tenantId: z.number(),
	userId: z.number(),
	role: tenantRoleSchema,
	name: z.string(),
	email: z.string(),
	joinedAt: z.iso.datetime(),
});
export type TenantMemberResponse = z.infer<typeof tenantMemberResponseSchema>;

export const tenantMemberParamsSchema = z.object({
	tenantId: z.coerce.number().int(),
	userId: z.coerce.number().int(),
});
export type TenantMemberParams = z.infer<typeof tenantMemberParamsSchema>;
