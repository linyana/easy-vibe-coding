import { z } from 'zod';

// URL-safe handle: lowercase letters, digits, single hyphens between segments.
// The rule lives here once; switch-workspace reuses the slug part.
export const workspaceFieldSchemas = {
	name: z.string().trim().min(1, 'Name is required').max(100),
	slug: z
		.string()
		.trim()
		.min(1, 'Slug is required')
		.max(63, 'Slug must be at most 63 characters')
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			'Use lowercase letters, numbers, and single hyphens',
		),
};

export const workspaceCreateSchema = z.object(workspaceFieldSchemas);
export type WorkspaceCreate = z.infer<typeof workspaceCreateSchema>;
