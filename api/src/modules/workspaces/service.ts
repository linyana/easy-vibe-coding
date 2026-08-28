import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type {
	WorkspaceListQuery,
	WorkspaceMemberResponse,
	WorkspaceMembersListQuery,
	WorkspaceRole,
	WorkspaceWithRole,
} from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import {
	workspaceMembers,
	workspaces,
	users,
	type Workspace,
} from '../../db/schema';
import { isForeignKeyViolation, isUniqueViolation } from '../../libs/dbError';
import { escapeLikePattern } from '../../libs/like';
import { Errors } from '../../libs/error';
import { assertOwner, assertOwnerOrAdmin } from '../../libs/workspaceRole';
import { slugify } from '../../libs/slugify';

// 90 chars + a '-999' collision suffix stays under the wire's max(100).
const SLUG_MAX_LENGTH = 90;

export const workspaceService = {
	async create({
		name,
		userId,
	}: {
		name: string;
		userId: number;
	}): Promise<Workspace> {
		// Workspace + owner membership land in one transaction — a workspace
		// never exists without its creator as owner. The slug is derived from
		// the name (collision-safe suffix; the unique constraint is the final
		// gate for concurrent creates).
		return db.transaction(async (tx) => {
			const base = (slugify(name) || 'workspace').slice(
				0,
				SLUG_MAX_LENGTH,
			);
			let slug = base;
			for (let i = 2; i <= 999; i++) {
				const taken = await tx.query.workspaces.findFirst({
					where: eq(workspaces.slug, slug),
					columns: { id: true },
				});
				if (!taken) break;
				slug = `${base}-${i}`;
			}
			const [workspace] = await tx
				.insert(workspaces)
				.values({ slug, name })
				.returning();
			await tx.insert(workspaceMembers).values({
				workspaceId: workspace!.id,
				userId,
				role: 'owner',
			});
			return workspace!;
		});
	},

	// GET /workspaces branches on the caller's admin flag (read from the users
	// row — the root routes only carry auth.userId, so the service checks):
	// - admins see every workspace, with `role` = their membership if they're
	//   in it (null otherwise)
	// - everyone else sees only their own memberships
	async list({
		userId,
		query,
	}: {
		userId: number;
		query: WorkspaceListQuery;
	}): Promise<{ items: WorkspaceWithRole[]; total: number }> {
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: { isAdmin: true },
		});
		const isAdmin = user?.isAdmin ?? false;
		const keyword = query.search?.trim();
		const nameFilter = keyword
			? ilike(workspaces.name, `%${escapeLikePattern(keyword)}%`)
			: undefined;
		const pageOffset = (query.page - 1) * query.pageSize;

		if (isAdmin) {
			const [row] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(workspaces)
				.where(nameFilter);
			const count = row?.count ?? 0;
			const items = await db
				.select({
					slug: workspaces.slug,
					name: workspaces.name,
					createdAt: workspaces.createdAt,
					updatedAt: workspaces.updatedAt,
					role: workspaceMembers.role,
				})
				.from(workspaces)
				.leftJoin(
					workspaceMembers,
					and(
						eq(workspaceMembers.workspaceId, workspaces.id),
						eq(workspaceMembers.userId, userId),
					),
				)
				.where(nameFilter)
				.orderBy(workspaces.id)
				.limit(query.pageSize)
				.offset(pageOffset);
			return {
				items: items as unknown as WorkspaceWithRole[],
				total: count,
			};
		}

		const where = and(eq(workspaceMembers.userId, userId), nameFilter);
		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(workspaceMembers)
			.innerJoin(
				workspaces,
				eq(workspaceMembers.workspaceId, workspaces.id),
			)
			.where(where);
		const count = row?.count ?? 0;
		const items = await db
			.select({
				slug: workspaces.slug,
				name: workspaces.name,
				createdAt: workspaces.createdAt,
				updatedAt: workspaces.updatedAt,
				role: workspaceMembers.role,
			})
			.from(workspaceMembers)
			.innerJoin(
				workspaces,
				eq(workspaceMembers.workspaceId, workspaces.id),
			)
			.where(where)
			.orderBy(workspaces.id)
			.limit(query.pageSize)
			.offset(pageOffset);
		// role is text in the DB, owner|member by construction — cast the
		// result once (a per-expression cast inside select isn't a valid column).
		return {
			items: items as unknown as WorkspaceWithRole[],
			total: count,
		};
	},

	// Membership was verified by the guard — this re-fetches the workspace row
	// (the guard's role rides along in the response).
	async detail({
		id,
		role,
	}: {
		id: number;
		role: WorkspaceRole | null;
	}): Promise<WorkspaceWithRole> {
		const workspace = await db.query.workspaces.findFirst({
			where: eq(workspaces.id, id),
		});
		if (!workspace) throw Errors.notFound('Workspace not found');
		return { ...workspace, role };
	},

	async rename({
		id,
		role,
		isAdmin,
		name,
	}: {
		id: number;
		role: WorkspaceRole | null;
		isAdmin: boolean;
		name: string;
	}): Promise<Workspace> {
		assertOwnerOrAdmin(
			role,
			isAdmin,
			'Only the owner can rename this workspace',
		);
		// Rename only touches the display name — the slug is the stable
		// public identifier and never changes.
		const [workspace] = await db
			.update(workspaces)
			.set({ name })
			.where(eq(workspaces.id, id))
			.returning();
		if (!workspace) throw Errors.notFound('Workspace not found');
		return workspace;
	},
};

export const memberService = {
	async list({
		workspaceId,
		query,
	}: {
		workspaceId: number;
		query: WorkspaceMembersListQuery;
	}): Promise<{ items: WorkspaceMemberResponse[]; total: number }> {
		const keyword = query.search?.trim();
		const where = and(
			eq(workspaceMembers.workspaceId, workspaceId),
			keyword
				? or(
						ilike(users.name, `%${escapeLikePattern(keyword)}%`),
						ilike(users.email, `%${escapeLikePattern(keyword)}%`),
					)
				: undefined,
		);

		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(workspaceMembers)
			.innerJoin(users, eq(workspaceMembers.userId, users.id))
			.where(where);
		const count = row?.count ?? 0;
		const items = await db
			.select({
				userId: workspaceMembers.userId,
				role: workspaceMembers.role,
				name: users.name,
				email: users.email,
				joinedAt: workspaceMembers.createdAt,
			})
			.from(workspaceMembers)
			.innerJoin(users, eq(workspaceMembers.userId, users.id))
			.where(where)
			.orderBy(users.name)
			.limit(query.pageSize)
			.offset((query.page - 1) * query.pageSize);
		return {
			items: items as unknown as WorkspaceMemberResponse[],
			total: count,
		};
	},

	// Add by email — the user must already have an account (register is the
	// only way users exist); new members always join as `member`.
	async add({
		workspaceId,
		role,
		email,
	}: {
		workspaceId: number;
		role: WorkspaceRole | null;
		email: string;
	}): Promise<WorkspaceMemberResponse> {
		assertOwner(role, 'Only the owner can add members');
		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		});
		if (!user) {
			throw Errors.notFound(
				'No account with this email — they need to register first',
			);
		}
		try {
			const [member] = await db
				.insert(workspaceMembers)
				.values({ workspaceId, userId: user.id, role: 'member' })
				.returning();
			return {
				userId: user.id,
				role: 'member',
				name: user.name,
				email: user.email,
				joinedAt: member!.createdAt,
			};
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw Errors.conflict('Already a member of this workspace');
			}
			// The user was deleted between the lookup and the insert — same
			// read as notFound, never a 500.
			if (isForeignKeyViolation(error)) {
				throw Errors.notFound('User not found');
			}
			throw error;
		}
	},

	async remove({
		workspaceId,
		role,
		userId,
		actingUserId,
	}: {
		workspaceId: number;
		role: WorkspaceRole | null;
		userId: number;
		actingUserId: number;
	}): Promise<WorkspaceMemberResponse> {
		assertOwner(role, 'Only the owner can remove members');
		// Self-removal is banned — it's the invariant that keeps every
		// workspace with at least one owner.
		if (userId === actingUserId) {
			throw Errors.badRequest('Owners cannot remove themselves');
		}
		const [member] = await db
			.delete(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					eq(workspaceMembers.userId, userId),
				),
			)
			.returning();
		if (!member) throw Errors.notFound('Member not found');
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});
		return {
			userId,
			role: member.role as WorkspaceRole,
			name: user!.name,
			email: user!.email,
			joinedAt: member.createdAt,
		};
	},
};
