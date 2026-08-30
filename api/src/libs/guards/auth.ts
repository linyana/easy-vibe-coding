import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { extractBearerToken, verifyAuthToken } from '../auth';
import { Errors } from '../error';
import { db } from '../../db/client';
import { accounts } from '../../db/schema';

// The shared auth primitives as Elysia macros. `auth: true` verifies the
// bearer token and injects `{ auth: { accountId, workspaceSlug } }`; `admin:
// true` additionally re-checks the account row's isAdmin flag — the DB, not
// the token, is the source of truth, so a revocation applies immediately
// (no 7-day TTL wait).
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
		resolve: async ({ headers }) => {
			const token = extractBearerToken(headers.authorization);
			if (!token) throw Errors.unauthorized('Missing access token');
			const { accountId, workspaceSlug } = await verifyAuthToken(token);
			const account = await db.query.accounts.findFirst({
				where: eq(accounts.id, accountId),
				columns: { isAdmin: true },
			});
			if (!account?.isAdmin) {
				throw Errors.forbidden('Admin access required');
			}
			return { auth: { accountId, workspaceSlug } };
		},
	});
