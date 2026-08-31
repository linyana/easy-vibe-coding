import { eq, ilike, or, sql } from 'drizzle-orm';
import type {
	WorkspaceAdminListQuery,
	WorkspaceUpdate,
} from '@easy-vibe-coding/shared';
import { db } from '../../../db/client';
import { accounts, workspaces } from '../../../db/schema';
import { isUniqueViolation } from '../../../libs/dbError';
import { Errors } from '../../../libs/error';
import { signAuthToken } from '../../../libs/auth';
import { escapeLikePattern } from '../../../libs/like';

// Platform-level workspace service — the admin counterpart of the
// membership-scoped user service in modules/workspaces. (The admin's
// entered-workspace member management lives in modules/admin/members.)
export const adminWorkspaceService = {
	// All workspaces, paginated — the admin counterpart of the membership list.
	async list({ page, pageSize, search }: WorkspaceAdminListQuery) {
		const keyword = search?.trim();
		const where = keyword
			? or(
					ilike(workspaces.slug, `%${escapeLikePattern(keyword)}%`),
					ilike(workspaces.name, `%${escapeLikePattern(keyword)}%`),
				)
			: undefined;

		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(workspaces)
			.where(where);
		const count = row?.count ?? 0;
		const items = await db
			.select()
			.from(workspaces)
			.where(where)
			.orderBy(workspaces.id)
			.limit(pageSize)
			.offset((page - 1) * pageSize);
		return { items, total: count };
	},

	// Duration windows (7/30 days before now), not calendar units — same
	// timezone-free semantics as the accounts stats.
	async stats() {
		const since = (days: number) =>
			new Date(Date.now() - days * 86_400_000).toISOString();
		const [row] = await db
			.select({
				total: sql<number>`count(*)::int`,
				createdLast7Days: sql<number>`count(*) filter (where created_at >= ${since(7)})::int`,
				createdLast30Days: sql<number>`count(*) filter (where created_at >= ${since(30)})::int`,
			})
			.from(workspaces);
		return row!;
	},

	async update({ id, data }: { id: number; data: WorkspaceUpdate }) {
		try {
			const [workspace] = await db
				.update(workspaces)
				.set(data)
				.where(eq(workspaces.id, id))
				.returning();
			if (!workspace) throw Errors.notFound('Workspace not found');
			return workspace;
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw Errors.conflict('This workspace slug is already taken');
			}
			throw error;
		}
	},

	// Exact operation (unlike batch semantics): deleting a missing workspace is
	// a notFound. Memberships cascade via the FK.
	async remove(id: number): Promise<{ success: true }> {
		const deleted = await db
			.delete(workspaces)
			.where(eq(workspaces.id, id))
			.returning({ id: workspaces.id });
		if (deleted.length === 0) throw Errors.notFound('Workspace not found');
		return { success: true };
	},

	// Soft-delete flip (idempotent): the row and memberships stay, but the
	// workspace behaves as deleted for non-admin members until re-enabled —
	// enforced at the role guard, switch, me, and member-list gates.
	async setDisabled({ id, disabled }: { id: number; disabled: boolean }) {
		const [workspace] = await db
			.update(workspaces)
			.set({ disabled })
			.where(eq(workspaces.id, id))
			.returning();
		if (!workspace) throw Errors.notFound('Workspace not found');
		return workspace;
	},

	// Enter ANY workspace from the platform list — the admin counterpart of
	// /auth/switch-workspace (whose gate is membership). The token gets the
	// same workspaceSlug claim, so after entering the session is
	// workspace-scoped exactly like a member's.
	async switchWorkspace({
		accountId,
		slug,
	}: {
		accountId: number;
		slug: string;
	}) {
		const workspace = await db.query.workspaces.findFirst({
			where: eq(workspaces.slug, slug),
			columns: { id: true, slug: true, name: true },
		});
		if (!workspace) throw Errors.notFound('Workspace not found');
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.id, accountId),
			columns: { tokenVersion: true },
		});
		return {
			token: await signAuthToken({
				accountId,
				workspaceSlug: slug,
				tokenVersion: account?.tokenVersion ?? 0,
			}),
			workspace,
		};
	},
};
