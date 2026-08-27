import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type {
	TenantListQuery,
	TenantMemberResponse,
	TenantMembersListQuery,
	TenantRole,
	TenantWithRole,
} from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { tenantMembers, tenants, users, type Tenant } from '../../db/schema';
import { isForeignKeyViolation, isUniqueViolation } from '../../libs/dbError';
import { escapeLikePattern } from '../../libs/like';
import { Errors } from '../../libs/error';

// Tenant-scoped writes require the owner role. The platform admin bypasses
// for the TENANT ENTITY (rename) but not for membership management — adding
// and removing members is the owner's job inside a tenant.
const assertOwner = (role: TenantRole | null, message: string) => {
	if (role !== 'owner') throw Errors.forbidden(message);
};

const assertOwnerOrAdmin = (
	role: TenantRole | null,
	isAdmin: boolean,
	message: string,
) => {
	if (role !== 'owner' && !isAdmin) throw Errors.forbidden(message);
};

export const tenantService = {
	async create({
		name,
		userId,
	}: {
		name: string;
		userId: number;
	}): Promise<Tenant> {
		// Tenant + owner membership land in one transaction — a tenant never
		// exists without its creator as owner.
		return db.transaction(async (tx) => {
			const [tenant] = await tx
				.insert(tenants)
				.values({ name })
				.returning();
			await tx.insert(tenantMembers).values({
				tenantId: tenant!.id,
				userId,
				role: 'owner',
			});
			return tenant!;
		});
	},

	// GET /tenants branches on the caller's admin flag (read from the users
	// row — the root routes only carry auth.userId, so the service checks):
	// - admins see every tenant, with `role` = their membership if they're in
	//   it (null otherwise)
	// - everyone else sees only their own memberships
	async list({
		userId,
		query,
	}: {
		userId: number;
		query: TenantListQuery;
	}): Promise<{ items: TenantWithRole[]; total: number }> {
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: { isAdmin: true },
		});
		const isAdmin = user?.isAdmin ?? false;
		const keyword = query.search?.trim();
		const nameFilter = keyword
			? ilike(tenants.name, `%${escapeLikePattern(keyword)}%`)
			: undefined;
		const pageOffset = (query.page - 1) * query.pageSize;

		if (isAdmin) {
			const [row] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(tenants)
				.where(nameFilter);
			const count = row?.count ?? 0;
			const items = await db
				.select({
					id: tenants.id,
					name: tenants.name,
					createdAt: tenants.createdAt,
					updatedAt: tenants.updatedAt,
					role: tenantMembers.role,
				})
				.from(tenants)
				.leftJoin(
					tenantMembers,
					and(
						eq(tenantMembers.tenantId, tenants.id),
						eq(tenantMembers.userId, userId),
					),
				)
				.where(nameFilter)
				.orderBy(tenants.id)
				.limit(query.pageSize)
				.offset(pageOffset);
			return {
				items: items as unknown as TenantWithRole[],
				total: count,
			};
		}

		const where = and(eq(tenantMembers.userId, userId), nameFilter);
		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(tenantMembers)
			.innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
			.where(where);
		const count = row?.count ?? 0;
		const items = await db
			.select({
				id: tenants.id,
				name: tenants.name,
				createdAt: tenants.createdAt,
				updatedAt: tenants.updatedAt,
				role: tenantMembers.role,
			})
			.from(tenantMembers)
			.innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
			.where(where)
			.orderBy(tenants.id)
			.limit(query.pageSize)
			.offset(pageOffset);
		// role is text in the DB, owner|member by construction — cast the
		// result once (a per-expression cast inside select isn't a valid column).
		return {
			items: items as unknown as TenantWithRole[],
			total: count,
		};
	},

	// Membership was verified by the guard — this re-fetches the tenant row
	// (the guard's role rides along in the response).
	async detail({
		tenantId,
		role,
	}: {
		tenantId: number;
		role: TenantRole | null;
	}): Promise<TenantWithRole> {
		const tenant = await db.query.tenants.findFirst({
			where: eq(tenants.id, tenantId),
		});
		if (!tenant) throw Errors.notFound('Tenant not found');
		return { ...tenant, role };
	},

	async rename({
		tenantId,
		role,
		isAdmin,
		name,
	}: {
		tenantId: number;
		role: TenantRole | null;
		isAdmin: boolean;
		name: string;
	}): Promise<Tenant> {
		assertOwnerOrAdmin(
			role,
			isAdmin,
			'Only the owner can rename this tenant',
		);
		const [tenant] = await db
			.update(tenants)
			.set({ name })
			.where(eq(tenants.id, tenantId))
			.returning();
		if (!tenant) throw Errors.notFound('Tenant not found');
		return tenant;
	},
};

export const memberService = {
	async list({
		tenantId,
		query,
	}: {
		tenantId: number;
		query: TenantMembersListQuery;
	}): Promise<{ items: TenantMemberResponse[]; total: number }> {
		const keyword = query.search?.trim();
		const where = and(
			eq(tenantMembers.tenantId, tenantId),
			keyword
				? or(
						ilike(users.name, `%${escapeLikePattern(keyword)}%`),
						ilike(users.email, `%${escapeLikePattern(keyword)}%`),
					)
				: undefined,
		);

		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(tenantMembers)
			.innerJoin(users, eq(tenantMembers.userId, users.id))
			.where(where);
		const count = row?.count ?? 0;
		const items = await db
			.select({
				tenantId: tenantMembers.tenantId,
				userId: tenantMembers.userId,
				role: tenantMembers.role,
				name: users.name,
				email: users.email,
				joinedAt: tenantMembers.createdAt,
			})
			.from(tenantMembers)
			.innerJoin(users, eq(tenantMembers.userId, users.id))
			.where(where)
			.orderBy(users.name)
			.limit(query.pageSize)
			.offset((query.page - 1) * query.pageSize);
		return {
			items: items as unknown as TenantMemberResponse[],
			total: count,
		};
	},

	// Add by email — the user must already have an account (register is the
	// only way users exist); new members always join as `member`.
	async add({
		tenantId,
		role,
		email,
	}: {
		tenantId: number;
		role: TenantRole | null;
		email: string;
	}): Promise<TenantMemberResponse> {
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
				.insert(tenantMembers)
				.values({ tenantId, userId: user.id, role: 'member' })
				.returning();
			return {
				tenantId,
				userId: user.id,
				role: 'member',
				name: user.name,
				email: user.email,
				joinedAt: member!.createdAt,
			};
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw Errors.conflict('Already a member of this tenant');
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
		tenantId,
		role,
		userId,
		actingUserId,
	}: {
		tenantId: number;
		role: TenantRole | null;
		userId: number;
		actingUserId: number;
	}): Promise<TenantMemberResponse> {
		assertOwner(role, 'Only the owner can remove members');
		// Self-removal is banned — it's the invariant that keeps every tenant
		// with at least one owner.
		if (userId === actingUserId) {
			throw Errors.badRequest('Owners cannot remove themselves');
		}
		const [member] = await db
			.delete(tenantMembers)
			.where(
				and(
					eq(tenantMembers.tenantId, tenantId),
					eq(tenantMembers.userId, userId),
				),
			)
			.returning();
		if (!member) throw Errors.notFound('Member not found');
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});
		return {
			tenantId,
			userId,
			role: member.role as TenantRole,
			name: user!.name,
			email: user!.email,
			joinedAt: member.createdAt,
		};
	},
};
