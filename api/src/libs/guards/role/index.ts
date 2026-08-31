import { Elysia } from 'elysia';
import { and, eq } from 'drizzle-orm';
import type { MemberRole } from '@easy-vibe-coding/shared';
import type { AuthShape } from '../auth';
import type { WorkspaceContext } from '../workspace';
import { workspaceGuard } from '../workspace';
import { Errors } from '../../error';
import { db } from '../../../db/client';
import { workspaceMembers } from '../../../db/schema';

// Workspace membership roles — the same vocabulary as the wire
// (memberRoleSchema), so the guard and the contract can never drift. 'admin'
// is deliberately NOT in this list: platform privilege is its own `admin`
// guard, never mixed into a role list.
export type WorkspaceRole = MemberRole;

// Pure membership authorization — the `workspace` dependency ran first, so the
// membership row is keyed by the resolved workspaceId, not a re-join. The
// soft-delete gate is here: a disabled workspace behaves as deleted for
// members (admins reach the workspace through `admin` + `workspace`, which has
// no role gate).
const resolveRole = async (
	context: { auth: AuthShape; workspace: WorkspaceContext },
	roles: readonly WorkspaceRole[],
) => {
	const { auth, workspace } = context;
	if (workspace.disabled) {
		throw Errors.forbidden('This workspace has been disabled');
	}
	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.accountId, auth.accountId),
			eq(workspaceMembers.workspaceId, workspace.id),
		),
		columns: { role: true },
	});
	if (membership === undefined) {
		throw Errors.forbidden('You are not a member of this workspace');
	}
	// Exact match: only the listed roles pass.
	if (!roles.includes(membership.role)) {
		const required = roles.join(' or ');
		throw Errors.forbidden(
			`This action requires the ${required} role in this workspace`,
		);
	}
	// Passthrough the consumed workspace so Elysia's macro inference exposes
	// it to handlers (the resolve return is the handler context type source).
	return { workspace };
};

// `role: [...]` is a function-form macro — the option value is the allowed
// role list. It composes the `workspace` guard so the workspace always
// resolves first and role only judges membership — it never re-resolves the
// slug. Exact match: only the listed roles pass — an owner does NOT satisfy
// `['member']`, so "any member" is `['owner', 'member']`.
export const roleGuard = new Elysia({ name: 'libs/guards/role' })
	.use(workspaceGuard)
	.macro('role', (roles: readonly WorkspaceRole[]) => ({
		auth: true,
		workspace: true,
		resolve: (context) =>
			resolveRole(
				context as unknown as {
					auth: AuthShape;
					workspace: WorkspaceContext;
				},
				roles,
			),
	}));
