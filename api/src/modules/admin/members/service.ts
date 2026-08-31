import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type {
	MemberAdminAdd,
	MemberAdminListQuery,
	MemberAdminRoleUpdate,
} from '@easy-vibe-coding/shared';
import { db } from '../../../db/client';
import { accounts, workspaceMembers } from '../../../db/schema';
import { isUniqueViolation } from '../../../libs/dbError';
import { normalizeEmail } from '../../../libs/email';
import { Errors } from '../../../libs/error';
import { escapeLikePattern } from '../../../libs/like';

// Admin member management on the entered workspace — split out of
// modules/admin/workspaces (which keeps the platform workspace CRUD). The
// workspace id comes from the `workspace` guard's session resolution (the
// token's workspaceSlug claim), never a URL param.
export const adminMemberService = {
	// Roster by workspace id (the member module's roster is scoped by the
	// token's workspaceSlug claim; this is the admin's by-id view). Paginated +
	// searchable like the other platform lists; search hits name and email.
	async listMembers(
		workspaceId: number,
		{ page, pageSize, search }: MemberAdminListQuery,
	) {
		const keyword = search?.trim();
		const where = and(
			eq(workspaceMembers.workspaceId, workspaceId),
			keyword
				? or(
						ilike(accounts.name, `%${escapeLikePattern(keyword)}%`),
						ilike(
							accounts.email,
							`%${escapeLikePattern(keyword)}%`,
						),
					)
				: undefined,
		);

		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(workspaceMembers)
			.innerJoin(accounts, eq(workspaceMembers.accountId, accounts.id))
			.where(where);
		const count = row?.count ?? 0;
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
			.where(where)
			.orderBy(accounts.id)
			.limit(pageSize)
			.offset((page - 1) * pageSize);
		return { items, total: count };
	},

	// Add a member by email — the account row is looked up (citext makes the
	// match case-insensitive); a workspace never has duplicate memberships.
	// The workspace's existence is guaranteed by the `workspace` guard.
	async addMember({
		workspaceId,
		data,
	}: {
		workspaceId: number;
		data: MemberAdminAdd;
	}) {
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
		data: MemberAdminRoleUpdate;
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
