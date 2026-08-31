import { Elysia } from 'elysia';
import { and, eq } from 'drizzle-orm';
import { extractBearerToken, verifyAuthToken } from '../auth';
import { Errors } from '../error';
import { db } from '../../db/client';
import { accounts, workspaceMembers, workspaces } from '../../db/schema';

// Guard role vocabulary — 'admin' is the platform flag (accounts.isAdmin);
// 'owner'/'member' are workspace membership roles (workspace_members.role).
export type GuardRole = 'admin' | 'owner' | 'member';

type AuthShape = { accountId: number; workspaceSlug?: string };

// The shared auth primitives as Elysia macros — two tiers, one verification.
// `role` composes `auth` (declares `auth: true`), so the token logic lives once:
// - `auth: true`  verifies the bearer token, injects
//                  `{ auth: { accountId, workspaceSlug? } }`.
// - `role: [...]` gates on a role list — the option value is the list itself
//                  (e.g. `.guard({ role: ['admin'] })`). Roles are re-checked
//                  against the DB per request: the row, not the token, is the
//                  source of truth, so a revoked admin or removed member fails
//                  immediately (no TTL wait). 'admin' = accounts.isAdmin;
//                  'owner'/'member' = workspace membership roles, which also
//                  require a workspace-scoped session and resolve the slug to
//                  a workspaceId via one membership join. Matching is exact:
//                  only the listed roles pass — an owner does NOT satisfy
//                  `['member']`, so "any member" is `['owner', 'member']`.
//                  Routes gated on
//                  workspace roles get `auth.workspaceId` (typed
//                  `number | undefined`, always defined at runtime — the `!`
//                  at the call site is the guard's contract).
export const authGuard = new Elysia({ name: 'libs/guards/auth' })
	.macro('auth', {
		resolve: async ({ headers }) => {
			const token = extractBearerToken(headers.authorization);
			if (!token) throw Errors.unauthorized('Missing access token');
			const { accountId, workspaceSlug } = await verifyAuthToken(token);
			return { auth: { accountId, workspaceSlug } };
		},
	})
	// Function-form macro: the allowed role list is the option value itself.
	// Composed macro contexts aren't typed inside a function-form macro's own
	// resolve, so the context is cast to the auth shape — the runtime order
	// (auth resolve → role resolve) is guaranteed by Elysia's macro recursion.
	.macro('role', (roles: readonly GuardRole[]) => ({
		auth: true,
		resolve: (context) =>
			resolveRole(context as unknown as { auth: AuthShape }, roles),
	}));

const resolveRole = async (
	context: { auth: AuthShape },
	roles: readonly GuardRole[],
) => {
	const { auth } = context;
	const wantAdmin = roles.includes('admin');
	const wantWorkspace = roles.some((role) => role !== 'admin');

	// Platform branch — re-check the isAdmin flag against the row per request.
	const adminOk =
		wantAdmin &&
		((
			await db.query.accounts.findFirst({
				where: eq(accounts.id, auth.accountId),
				columns: { isAdmin: true },
			})
		)?.isAdmin ??
			false);

	// Workspace branch — the slug claim can outlive membership (member
	// removed, workspace deleted), so one join re-checks it and resolves the
	// workspaceId against the row, not the token.
	let membership:
		| { id: number; slug: string; role: 'owner' | 'member' }
		| undefined;
	if (wantWorkspace && auth.workspaceSlug !== undefined) {
		const [row] = await db
			.select({
				id: workspaces.id,
				slug: workspaces.slug,
				role: workspaceMembers.role,
			})
			.from(workspaceMembers)
			.innerJoin(
				workspaces,
				eq(workspaceMembers.workspaceId, workspaces.id),
			)
			.where(
				and(
					eq(workspaceMembers.accountId, auth.accountId),
					eq(workspaces.slug, auth.workspaceSlug),
				),
			)
			.limit(1);
		membership = row;
	}

	// Exact match: only the listed roles pass.
	const roleOk = membership !== undefined && roles.includes(membership.role);

	const allowed = adminOk || roleOk;
	if (!allowed) {
		if (wantWorkspace && !adminOk) {
			if (auth.workspaceSlug === undefined) {
				throw Errors.forbidden(
					'This session is not scoped to a workspace',
				);
			}
			if (membership === undefined) {
				throw Errors.forbidden(
					'You are not a member of this workspace',
				);
			}
			const required = roles
				.filter((role) => role !== 'admin')
				.join(' or ');
			throw Errors.forbidden(
				`This action requires the ${required} role in this workspace`,
			);
		}
		throw Errors.forbidden('Admin access required');
	}

	return {
		auth: {
			accountId: auth.accountId,
			workspaceId: membership?.id,
			workspaceSlug: auth.workspaceSlug,
		},
	};
};
