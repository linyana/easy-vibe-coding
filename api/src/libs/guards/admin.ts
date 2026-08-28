import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { extractBearerToken, verifyAuthToken } from '../auth';
import { Errors } from '../error';

// The context the derive needs — a subset of Elysia's request context.
export interface AdminScopeContext {
	headers: { authorization?: string | undefined };
}

// Standalone derive for the platform-admin surface (global user management,
// all-workspaces views). Like workspaceScope, auth is verified inline (Elysia
// composes derives ahead of macro resolves) and the admin flag is read from
// the users row — the DB is the source of truth, never the token. Injects
// `{ auth: { userId } }`; 401 without a valid token, 403 when the user isn't
// an admin. New admin-only modules add one line:
//   .use(adminScope).get('/')...
export async function adminScope({ headers }: AdminScopeContext) {
	const token = extractBearerToken(headers.authorization);
	if (!token) throw Errors.unauthorized('Missing access token');
	const userId = await verifyAuthToken(token);
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { isAdmin: true },
	});
	if (!user?.isAdmin) {
		throw Errors.forbidden('Admin access required');
	}
	return { auth: { userId } };
}
