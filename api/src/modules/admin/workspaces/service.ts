import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type {
	WorkspaceAdminListQuery,
	WorkspaceMemberAdd,
	WorkspaceMemberRoleUpdate,
	WorkspaceUpdate,
} from '@easy-vibe-coding/shared';
import { db } from '../../../db/client';
import { accounts, workspaces, workspaceMembers } from '../../../db/schema';
import { isUniqueViolation } from '../../../libs/dbError';
import { normalizeEmail } from '../../../libs/email';
import { Errors } from '../../../libs/error';
import { escapeLikePattern } from '../../../libs/like';

// Platform-level workspace service — the admin counterpart of the
// membership-scoped user service in modules/workspaces.
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

	// Roster by workspace id (the member module's roster is scoped by the
	// token's workspaceSlug claim; this is the admin's by-id view).
	async listMembers(workspaceId: number) {
		const items = await db
			.select({
				id: accounts.id,
				name: accounts.name,
				email: accounts.email,
				role: workspaceMembers.role,
				joinedAt: workspaceMembers.createdAt,
			})
			.from(workspaceMembers)
			.innerJoin(accounts, eq(workspaceMembers.accountId, accounts.id))
			.where(eq(workspaceMembers.workspaceId, workspaceId))
			.orderBy(accounts.id);
		return { items, total: items.length };
	},

	// Add a member by email — the account row is looked up (citext makes the
	// match case-insensitive); a workspace never has duplicate memberships.
	async addMember({
		workspaceId,
		data,
	}: {
		workspaceId: number;
		data: WorkspaceMemberAdd;
	}) {
		const workspace = await db.query.workspaces.findFirst({
			where: eq(workspaces.id, workspaceId),
			columns: { id: true },
		});
		if (!workspace) throw Errors.notFound('Workspace not found');

		const account = await db.query.accounts.findFirst({
			where: eq(accounts.email, normalizeEmail(data.email)),
			columns: { id: true },
		});
		if (!account) {
			throw Errors.notFound(
				'No account with this email — invite them first',
			);
		}

		try {
			await db.insert(workspaceMembers).values({
				workspaceId,
				accountId: account.id,
				role: 'member',
			});
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw Errors.conflict('This account is already a member');
			}
			throw error;
		}
		return { success: true };
	},

	// Change a member's role. The "no owner-less workspace" invariant (every
	// workspace is born with its creator as owner) is enforced here: the last
	// owner cannot be demoted.
	async updateMemberRole({
		workspaceId,
		accountId,
		data,
	}: {
		workspaceId: number;
		accountId: number;
		data: WorkspaceMemberRoleUpdate;
	}) {
		if (data.role !== 'owner') {
			await this.assertNotLastOwner({ workspaceId, accountId });
		}
		const updated = await db
			.update(workspaceMembers)
			.set({ role: data.role })
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					eq(workspaceMembers.accountId, accountId),
				),
			)
			.returning({ id: workspaceMembers.id });
		if (updated.length === 0) {
			throw Errors.notFound('This account is not a member');
		}
		return { success: true };
	},

	// Remove a member. Same invariant as the role change: the last owner of a
	// workspace cannot be removed (workspaces stay owned).
	async removeMember({
		workspaceId,
		accountId,
	}: {
		workspaceId: number;
		accountId: number;
	}) {
		const member = await db.query.workspaceMembers.findFirst({
			where: and(
				eq(workspaceMembers.workspaceId, workspaceId),
				eq(workspaceMembers.accountId, accountId),
			),
		});
		if (!member) {
			throw Errors.notFound('This account is not a member');
		}
		if (member.role === 'owner') {
			await this.assertNotLastOwner({ workspaceId, accountId });
		}
		await db
			.delete(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					eq(workspaceMembers.accountId, accountId),
				),
			);
		return { success: true };
	},

	async assertNotLastOwner({
		workspaceId,
		accountId,
	}: {
		workspaceId: number;
		accountId: number;
	}) {
		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					eq(workspaceMembers.role, 'owner'),
				),
			);
		if ((row?.count ?? 0) <= 1) {
			const isOwner = await db.query.workspaceMembers.findFirst({
				where: and(
					eq(workspaceMembers.workspaceId, workspaceId),
					eq(workspaceMembers.accountId, accountId),
					eq(workspaceMembers.role, 'owner'),
				),
				columns: { id: true },
			});
			if (isOwner) {
				throw Errors.conflict(
					'A workspace must keep at least one owner',
				);
			}
		}
	},
};
