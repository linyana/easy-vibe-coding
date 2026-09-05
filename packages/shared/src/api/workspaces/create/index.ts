import { z } from 'zod';

// URL-safe handle: lowercase letters, digits, single hyphens between segments.
// The rule lives here once; switch-workspace reuses the slug part.
//
// Reserved words: Elysia serves static segments before the `/:slug` param, so
// any fixed second segment of the user surface (/workspaces/<static>) shadows
// a workspace whose slug equals it. `admin` is the only one today — the
// platform module lives there (/workspaces/admin*), making such a workspace
// unreachable from its own pages. Keeping the list here (one rule) means a
// future static child only needs an entry, never a per-endpoint mirror.
export const reservedWorkspaceSlugs = ['admin'] as const;

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
		)
		.refine(
			(slug) =>
				!reservedWorkspaceSlugs.includes(
					slug as (typeof reservedWorkspaceSlugs)[number],
				),
			'This slug is reserved',
		),
};

export const workspaceCreateSchema = z.object(workspaceFieldSchemas);
export type WorkspaceCreate = z.infer<typeof workspaceCreateSchema>;
