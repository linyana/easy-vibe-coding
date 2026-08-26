import { and, eq, gte, ilike, inArray, lt, or, sql } from 'drizzle-orm';
import type {
	UserCreate,
	UserListQuery,
	UserUpdate,
} from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { users, type User } from '../../db/schema';
import { isUniqueViolation } from '../../libs/dbError';
import { normalizeEmail } from '../../libs/email';
import { Errors } from '../../libs/error';

export const userService = {
	// Duration windows (7/30 days before now), not calendar units — a duration
	// needs no timezone, and the server never guesses one.
	async stats() {
		const since = (days: number) =>
			new Date(Date.now() - days * 86_400_000).toISOString();
		const [row] = await db
			.select({
				total: sql<number>`count(*)::int`,
				createdLast7Days: sql<number>`count(*) filter (where created_at >= ${since(7)})::int`,
				createdLast30Days: sql<number>`count(*) filter (where created_at >= ${since(30)})::int`,
			})
			.from(users);
		return row!;
	},

	async list({ page, pageSize, search, createdRange }: UserListQuery) {
		const keyword = search?.trim();
		// Half-open range: gte lower bound, lt upper (the client sends the start
		// of the day after the picked "to" day) — no end-of-day sentinel.
		const where = and(
			keyword
				? or(
						ilike(users.name, `%${keyword}%`),
						ilike(users.email, `%${keyword}%`),
					)
				: undefined,
			createdRange?.from
				? gte(users.createdAt, createdRange.from)
				: undefined,
			createdRange?.to ? lt(users.createdAt, createdRange.to) : undefined,
		);

		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(users)
			.where(where);
		const count = row?.count ?? 0;
		const items = await db
			.select()
			.from(users)
			.where(where)
			.orderBy(users.id)
			.limit(pageSize)
			.offset((page - 1) * pageSize);
		return { items, total: count };
	},

	async detail(id: number): Promise<User> {
		const user = await db.query.users.findFirst({
			where: eq(users.id, id),
		});
		if (!user) throw Errors.notFound('User not found');
		return user;
	},

	async create(data: UserCreate): Promise<User> {
		// Same argon2id policy as auth/register — the password never crosses back over the wire.
		const passwordHash = await Bun.password.hash(data.password);
		try {
			const [user] = await db
				.insert(users)
				.values({
					name: data.name,
					email: normalizeEmail(data.email),
					passwordHash,
				})
				.returning();
			return user!;
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw Errors.conflict('This email is already registered');
			}
			throw error;
		}
	},

	async update({
		id,
		data,
	}: {
		id: number;
		data: UserUpdate;
	}): Promise<User> {
		try {
			// normalizeEmail on the partial: a no-op when email isn't in the patch.
			const patch = data.email
				? { ...data, email: normalizeEmail(data.email) }
				: data;
			const [user] = await db
				.update(users)
				.set(patch)
				.where(eq(users.id, id))
				.returning();
			if (!user) throw Errors.notFound('User not found');
			return user;
		} catch (error) {
			// Changing email to one already in use → 409, never an unhandled 500.
			if (isUniqueViolation(error)) {
				throw Errors.conflict('This email is already registered');
			}
			throw error;
		}
	},

	async remove(id: number): Promise<{ success: true }> {
		const deleted = await db
			.delete(users)
			.where(eq(users.id, id))
			.returning({ id: users.id });
		if (deleted.length === 0) throw Errors.notFound('User not found');
		return { success: true };
	},

	async removeMany(ids: number[]): Promise<{ deleted: number }> {
		// Batch semantics: missing ids are silently skipped (unlike single remove's notFound).
		const deleted = await db
			.delete(users)
			.where(inArray(users.id, ids))
			.returning({ id: users.id });
		return { deleted: deleted.length };
	},
};
