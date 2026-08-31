import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import type { AuthShape } from '../auth';
import { authGuard } from '../auth';
import { Errors } from '../../error';
import { db } from '../../../db/client';
import { workspaces } from '../../../db/schema';

// The workspace context the `workspace` guard resolves and injects. Handlers
// read `({ workspace })` — the session, not a URL id, is the address.
export type WorkspaceContext = {
	id: number;
	slug: string;
	name: string;
	disabled: boolean;
};

// The shared workspace-scoped surface guard: requires a workspace-scoped
// session (the token's workspaceId claim — the int PK, so a slug rename never
// orphans in-flight sessions), re-verifies the workspace still exists (the
// claim can outlive a deleted workspace), and injects
// `workspace { id, slug, name, disabled }` into the context.
// Authorization-free by design — compose `role` (sibling module) or `admin`
// (auth module) for access.
const resolveWorkspace = async (context: { auth: AuthShape }) => {
	const { auth } = context;
	if (auth.workspaceId === undefined) {
		throw Errors.forbidden('This session is not scoped to a workspace');
	}
	const workspace = await db.query.workspaces.findFirst({
		where: eq(workspaces.id, auth.workspaceId),
		columns: { id: true, slug: true, name: true, disabled: true },
	});
	if (!workspace) {
		throw Errors.forbidden('This workspace no longer exists');
	}
	return { workspace };
};

export const workspaceGuard = new Elysia({ name: 'libs/guards/workspace' })
	.use(authGuard)
	.macro('workspace', {
		auth: true,
		resolve: (context) =>
			resolveWorkspace(context as unknown as { auth: AuthShape }),
	});
