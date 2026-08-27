import { and, eq } from 'drizzle-orm';
import type { TenantRole } from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { tenantMembers, tenants, users } from '../../db/schema';
import { extractBearerToken, verifyAuthToken } from '../auth';
import { Errors } from '../error';

// The context the derive needs — a subset of Elysia's request context.
export interface TenantScopeContext {
	params: { tenantId?: unknown };
	headers: { authorization?: string | undefined };
}

// Standalone derive for tenant-scoped modules — ONE gate for "signed in AND
// a member of :tenantId". Auth is handled inline (same libs/auth primitives
// the authGuard macro uses) because Elysia composes derives AHEAD of macro
// resolves: a sibling derive can't read an injected `auth`. It verifies the
// bearer token, reads the tenant id from the route params, verifies
// membership, and injects `{ auth: { userId, isAdmin }, tenant: { tenantId,
// role } }` — 401 without a valid token, 404 when the tenant doesn't exist,
// 403 when the user isn't a member. Admins bypass the membership check
// (`role` is null for them): they can view any tenant, but member management
// stays owner-only (the services enforce the role).
export async function tenantScope({ params, headers }: TenantScopeContext) {
	const token = extractBearerToken(headers.authorization);
	if (!token) throw Errors.unauthorized('Missing access token');
	const userId = await verifyAuthToken(token);

	const tenantId = Number(params.tenantId);
	if (!Number.isInteger(tenantId) || tenantId <= 0) {
		throw Errors.badRequest('Invalid tenant id');
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { isAdmin: true },
	});
	const isAdmin = user?.isAdmin ?? false;

	if (isAdmin) {
		const tenant = await db.query.tenants.findFirst({
			where: eq(tenants.id, tenantId),
		});
		if (!tenant) throw Errors.notFound('Tenant not found');
		return { auth: { userId, isAdmin }, tenant: { tenantId, role: null } };
	}

	const membership = await db.query.tenantMembers.findFirst({
		where: and(
			eq(tenantMembers.tenantId, tenantId),
			eq(tenantMembers.userId, userId),
		),
	});
	if (!membership) {
		const tenant = await db.query.tenants.findFirst({
			where: eq(tenants.id, tenantId),
		});
		if (!tenant) throw Errors.notFound('Tenant not found');
		throw Errors.forbidden('You are not a member of this tenant');
	}
	return {
		auth: { userId, isAdmin },
		tenant: {
			tenantId,
			role: membership.role as TenantRole,
		},
	};
}
