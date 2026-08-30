import { and, eq, gte, ilike, inArray, lt, or, sql } from 'drizzle-orm';
import type {
	AccountCreate,
	AccountListQuery,
	AccountUpdate,
} from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { accounts, type Account } from '../../db/schema';
import { isUniqueViolation } from '../../libs/dbError';
import { normalizeEmail } from '../../libs/email';
import { Errors } from '../../libs/error';
import { escapeLikePattern } from '../../libs/like';

export const accountService = {
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
			.from(accounts);
		return row!;
	},

	async list({ page, pageSize, search, createdRange }: AccountListQuery) {
		const keyword = search?.trim();
		// Half-open range: gte lower bound, lt upper (the client sends the start
		// of the day after the picked "to" day) — no end-of-day sentinel.
		const where = and(
			keyword
				? or(
						ilike(accounts.name, `%${escapeLikePattern(keyword)}%`),
						ilike(
							accounts.email,
							`%${escapeLikePattern(keyword)}%`,
						),
					)
				: undefined,
			createdRange?.from
				? gte(accounts.createdAt, createdRange.from)
				: undefined,
			createdRange?.to
				? lt(accounts.createdAt, createdRange.to)
				: undefined,
		);

		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(accounts)
			.where(where);
		const count = row?.count ?? 0;
		const items = await db
			.select()
			.from(accounts)
			.where(where)
			.orderBy(accounts.id)
			.limit(pageSize)
			.offset((page - 1) * pageSize);
		return { items, total: count };
	},

	async detail(id: number): Promise<Account> {
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.id, id),
		});
		if (!account) throw Errors.notFound('Account not found');
		return account;
	},

	async create(data: AccountCreate): Promise<Account> {
		// Same argon2id policy as auth/register — the password never crosses back over the wire.
		const passwordHash = await Bun.password.hash(data.password);
		try {
			const [account] = await db
				.insert(accounts)
				.values({
					name: data.name,
					email: normalizeEmail(data.email),
					passwordHash,
				})
				.returning();
			return account!;
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
		data: AccountUpdate;
	}): Promise<Account> {
		try {
			// normalizeEmail on the partial: a no-op when email isn't in the patch.
			const patch = data.email
				? { ...data, email: normalizeEmail(data.email) }
				: data;
			const [account] = await db
				.update(accounts)
				.set(patch)
				.where(eq(accounts.id, id))
				.returning();
			if (!account) throw Errors.notFound('Account not found');
			return account;
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
			.delete(accounts)
			.where(eq(accounts.id, id))
			.returning({ id: accounts.id });
		if (deleted.length === 0) throw Errors.notFound('Account not found');
		return { success: true };
	},

	async removeMany(ids: number[]): Promise<{ deleted: number }> {
		// Batch semantics: missing ids are silently skipped (unlike single remove's notFound).
		const deleted = await db
			.delete(accounts)
			.where(inArray(accounts.id, ids))
			.returning({ id: accounts.id });
		return { deleted: deleted.length };
	},
};
