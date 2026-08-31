import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { extractBearerToken, verifyAuthToken } from '../../auth';
import { Errors } from '../../error';
import { db } from '../../../db/client';
import { accounts } from '../../../db/schema';

// The authenticated session the `auth` macro injects.
export type AuthShape = { accountId: number; workspaceSlug?: string };

// Platform admin gate: re-checks accounts.isAdmin against the DB row per
// request — the row is the source of truth, so revoking takes effect
// immediately, no TTL wait. 'admin' is deliberately not a role (it never
// appears in a role list); it lives on the auth tier as the platform
// extension of token verification.
const resolveAdmin = async (context: { auth: AuthShape }) => {
	const account = await db.query.accounts.findFirst({
		where: eq(accounts.id, context.auth.accountId),
		columns: { isAdmin: true },
	});
	if (!account?.isAdmin) throw Errors.forbidden('Admin access required');
};

// The token-verification tier: `auth: true` verifies the bearer token, then
// re-reads the account row — existence (a deleted account's tokens die on
// every surface, not just /me) and the tokenVersion counter (tokens signed
// before a password reset/change are revoked immediately). It injects
// `{ auth: { accountId, workspaceSlug? } }`. `admin: true` composes it with
// the per-request isAdmin re-check. Workspace-scoped surfaces build on this
// with the `workspace`/`role` macros from the sibling modules.
export const authGuard = new Elysia({ name: 'libs/guards/auth' })
	.macro('auth', {
		resolve: async ({ headers }) => {
			const token = extractBearerToken(headers.authorization);
			if (!token) throw Errors.unauthorized('Missing access token');
			const { accountId, workspaceSlug, tokenVersion } =
				await verifyAuthToken(token);
			const account = await db.query.accounts.findFirst({
				where: eq(accounts.id, accountId),
				columns: { tokenVersion: true },
			});
			if (!account) {
				throw Errors.unauthorized('This account no longer exists');
			}
			if (account.tokenVersion !== tokenVersion) {
				throw Errors.unauthorized(
					'This session has been revoked. Please sign in again.',
				);
			}
			return { auth: { accountId, workspaceSlug } };
		},
	})
	.macro('admin', {
		auth: true,
		resolve: (context) =>
			resolveAdmin(context as unknown as { auth: AuthShape }),
	});
