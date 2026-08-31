import { Elysia } from 'elysia';
import { and, eq } from 'drizzle-orm';
import type { MemberRole } from '@easy-vibe-coding/shared';
import { extractBearerToken, verifyAuthToken } from '../auth';
import { Errors } from '../error';
import { db } from '../../db/client';
import { accounts, workspaceMembers, workspaces } from '../../db/schema';

// Workspace membership roles — the same vocabulary as the wire
// (memberRoleSchema), so the guard and the contract can never drift. 'admin'
// is deliberately NOT in this list: platform privilege is its own `admin`
// guard, never mixed into a role list.
export type WorkspaceRole = MemberRole;

// The workspace context the `workspace` guard resolves and injects. Handlers
// read `({ workspace })` — the session, not a URL id, is the address.
type WorkspaceContext = {
	id: number;
	slug: string;
	name: string;
	disabled: boolean;
};

type AuthShape = { accountId: number; workspaceSlug?: string };

// The shared auth primitives as Elysia macros — four tiers, one verification:
// - `auth: true`      verifies the bearer token, injects
//                     `{ auth: { accountId, workspaceSlug? } }`.
// - `admin: true`     platform admin gate: re-checks accounts.isAdmin against
//                     the DB row per request (revoking takes effect
//                     immediately, no TTL wait).
// - `workspace: true` the shared workspace-scoped surface guard: requires a
//                     workspace-scoped session (the token's workspaceSlug
//                     claim), re-verifies the workspace still exists, and
//                     injects `workspace { id, slug, name, disabled }` into
//                     the context. Authorization-free by design.
// - `role: [...]`     workspace membership role gate (owner/member, exact
//                     match). It declares `workspace: true` as a dependency,
//                     so the workspace guard always runs first and role only
//                     judges membership — it never re-resolves the slug.
//                     Exact match: only the listed roles pass — an owner does
//                     NOT satisfy `['member']`, so "any member" is
//                     `['owner', 'member']`. The soft-delete gate lives here:
//                     a disabled workspace behaves as deleted for members.
//
// Composition is the vocabulary: `role: ['owner', 'member']` for member
// surfaces, `admin: true` for platform surfaces, `admin: true` +
// `workspace: true` for the admin's entered-workspace surface.
export const authGuard = new Elysia({ name: 'libs/guards/auth' })
	.macro('auth', {
		resolve: async ({ headers }) => {
			const token = extractBearerToken(headers.authorization);
			if (!token) throw Errors.unauthorized('Missing access token');
			const { accountId, workspaceSlug } = await verifyAuthToken(token);
			return { auth: { accountId, workspaceSlug } };
		},
	})
	.macro('admin', {
		auth: true,
		resolve: (context) =>
			resolveAdmin(context as unknown as { auth: AuthShape }),
	})
	.macro('workspace', {
		auth: true,
		resolve: (context) =>
			resolveWorkspace(context as unknown as { auth: AuthShape }),
	})
	// Function-form macro: the allowed role list is the option value itself.
	// Composed macro contexts aren't typed inside a function-form macro's own
	// resolve, so the context is cast to the auth + workspace shape — the
	// runtime order (auth → workspace → role) is guaranteed by Elysia's macro
	// recursion over the declared `auth` and `workspace` dependencies.
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

const resolveAdmin = async (context: { auth: AuthShape }) => {
	const account = await db.query.accounts.findFirst({
		where: eq(accounts.id, context.auth.accountId),
		columns: { isAdmin: true },
	});
	if (!account?.isAdmin) throw Errors.forbidden('Admin access required');
};

// The shared workspace-scoped surface guard: the slug claim can outlive the
// workspace (deleted), so existence is re-verified per request and the
// workspace is injected for handlers. Authorization is deliberately absent —
// compose `role` or `admin` for access.
const resolveWorkspace = async (context: { auth: AuthShape }) => {
	const { auth } = context;
	if (auth.workspaceSlug === undefined) {
		throw Errors.forbidden('This session is not scoped to a workspace');
	}
	const workspace = await db.query.workspaces.findFirst({
		where: eq(workspaces.slug, auth.workspaceSlug),
		columns: { id: true, slug: true, name: true, disabled: true },
	});
	if (!workspace) {
		throw Errors.forbidden('This workspace no longer exists');
	}
	return { workspace };
};

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
