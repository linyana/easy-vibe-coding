import { and, eq } from 'drizzle-orm';
import type { WorkspaceRole } from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { workspaceMembers, workspaces, users } from '../../db/schema';
import { extractBearerToken, verifyAuthToken } from '../auth';
import { Errors } from '../error';

// The context the derive needs — a subset of Elysia's request context.
export interface WorkspaceScopeContext {
	params: { workspaceSlug?: unknown };
	headers: { authorization?: string | undefined };
}

// Standalone derive for workspace-scoped modules — ONE gate for "signed in
// AND a member of :workspaceSlug". Auth is handled inline (same libs/auth
// primitives the authGuard macro uses) because Elysia composes derives AHEAD
// of macro resolves: a sibling derive can't read an injected `auth`. It
// verifies the bearer token, resolves the workspace by its public slug,
// verifies membership, and injects `{ auth: { userId, isAdmin }, workspace:
// { id, slug, role } }` — 401 without a valid token, 404 when the workspace
// doesn't exist, 403 when the user isn't a member. Admins bypass the
// membership check (`role` is null for them): they can view any workspace,
// but member management stays owner-only (the services enforce the role).
export async function workspaceScope({
	params,
	headers,
}: WorkspaceScopeContext) {
	const token = extractBearerToken(headers.authorization);
	if (!token) throw Errors.unauthorized('Missing access token');
	const userId = await verifyAuthToken(token);

	const slug =
		typeof params.workspaceSlug === 'string' ? params.workspaceSlug : '';
	if (!slug || slug.length > 100) {
		throw Errors.badRequest('Invalid workspace');
	}

	// Slug → workspace row once, shared by the admin and member paths.
	const workspace = await db.query.workspaces.findFirst({
		where: eq(workspaces.slug, slug),
	});
	if (!workspace) throw Errors.notFound('Workspace not found');

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { isAdmin: true },
	});
	const isAdmin = user?.isAdmin ?? false;

	if (isAdmin) {
		return {
			auth: { userId, isAdmin },
			workspace: { id: workspace.id, slug, role: null },
		};
	}

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.workspaceId, workspace.id),
			eq(workspaceMembers.userId, userId),
		),
	});
	if (!membership) {
		throw Errors.forbidden('You are not a member of this workspace');
	}
	return {
		auth: { userId, isAdmin },
		workspace: {
			id: workspace.id,
			slug,
			role: membership.role as WorkspaceRole,
		},
	};
}
