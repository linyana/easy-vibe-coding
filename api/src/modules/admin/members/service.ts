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

// The transaction handle type — the callback param of db.transaction, typed
// once so the owner guard's mutation callback stays tx-compatible.
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Serialize owner-count mutations: lock the workspace's owner rows so two
// concurrent demotions/removals can't both read a stale count and leave a
// workspace owner-less (the old read-then-check TOCTOU). FOR UPDATE + READ
// COMMITTED: a transaction blocked on the lock re-reads after it is released,
// so the second sees the first's commit — the demoted row no longer matches
// `role = 'owner'` — and the check and the write commit atomically.
const withOwnerGuard = async <T>(
	workspaceId: number,
	accountId: number,
	act: (tx: DbTx) => Promise<T>,
): Promise<T> => {
	return db.transaction(async (tx) => {
		const owners = await tx
			.select({ accountId: workspaceMembers.accountId })
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					eq(workspaceMembers.role, 'owner'),
				),
			)
			.for('update');
		if (
			owners.length <= 1 &&
			owners.some((owner) => owner.accountId === accountId)
		) {
			throw Errors.conflict('A workspace must keep at least one owner');
		}
		return act(tx);
	});
};

// Admin member management on the entered workspace — split out of
// modules/admin/workspaces (which keeps the platform workspace CRUD). The
// workspace id comes from the `workspace` guard's resolution of the request's
// X-Workspace-Slug header (the URL slug is the address), never a URL id.
export const adminMemberService = {
	// Roster by workspace id (the member module's roster resolves the same
	// request slug; this is the admin's by-id view). Paginated + searchable
	// like the other platform lists; search hits name and email.
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
	// owner cannot be demoted. Demotions run under the owner-row lock (see
	// withOwnerGuard) so concurrent demotions can't both pass a stale count;
	// promotions only grow the count and need no lock.
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
			return withOwnerGuard(workspaceId, accountId, async (tx) => {
				const updated = await tx
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
			});
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
			return withOwnerGuard(workspaceId, accountId, async (tx) => {
				await tx
					.delete(workspaceMembers)
					.where(
						and(
							eq(workspaceMembers.workspaceId, workspaceId),
							eq(workspaceMembers.accountId, accountId),
						),
					);
				return { success: true };
			});
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
};
