import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import type { AuthShape } from '../auth';
import { authGuard } from '../auth';
import { Errors } from '../../error';
import { db } from '../../../db/client';
import { workspaces } from '../../../db/schema';

// The workspace context the `workspace` guard resolves and injects. The URL
// slug (X-Workspace-Slug header, written by the slug route the app renders)
// is the address — the guard re-resolves and re-validates it per request, so
// nothing workspace-scoped lives in the session anymore.
export type WorkspaceContext = {
	id: number;
	slug: string;
	name: string;
	disabled: boolean;
};

// The shared workspace-scoped surface guard: requires the request to name its
// workspace (the X-Workspace-Slug header — the app's API door injects it from
// the current slug route), resolves the row, and injects
// `workspace { id, slug, name, disabled }` into the context.
// Authorization-free by design — compose `role` (sibling module) or `admin`
// (auth module) for access. FAIL-CLOSED: because any authenticated account
// can present any slug, this macro alone must never gate user data — role's
// membership check is the user-side authorization; the only other consumer is
// the admin tier (admin: true + workspace: true), already platform-gated.
const resolveWorkspace = async (context: {
	auth: AuthShape;
	headers: Record<string, string | undefined>;
}) => {
	const slug = context.headers['x-workspace-slug'];
	if (!slug) {
		throw Errors.forbidden('This request is not scoped to a workspace');
	}
	const workspace = await db.query.workspaces.findFirst({
		where: eq(workspaces.slug, slug),
		columns: { id: true, slug: true, name: true, disabled: true },
	});
	if (!workspace) {
		throw Errors.forbidden('This workspace does not exist');
	}
	return { workspace };
};

export const workspaceGuard = new Elysia({ name: 'libs/guards/workspace' })
	.use(authGuard)
	.macro('workspace', {
		auth: true,
		resolve: (context) =>
			resolveWorkspace(
				context as unknown as {
					auth: AuthShape;
					headers: Record<string, string | undefined>;
				},
			),
	});
