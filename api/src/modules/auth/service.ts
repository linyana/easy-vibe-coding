import { and, eq, sql } from 'drizzle-orm';
import type {
	AuthLogin,
	AuthRegister,
	AuthResponse,
	AccountResponse,
	MeResponse,
	SwitchWorkspaceResponse,
	WorkspaceRef,
} from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import {
	accounts,
	workspaceMembers,
	workspaces,
	type Account,
} from '../../db/schema';
import { signAuthToken } from '../../libs/auth';
import { isUniqueViolation } from '../../libs/dbError';
import { normalizeEmail } from '../../libs/email';
import { Errors } from '../../libs/error';

// Explicitly picked so passwordHash never crosses the wire (matches accountResponseSchema).
const pickAccount = (account: Account): AccountResponse => ({
	id: account.id,
	name: account.name,
	email: account.email,
	isAdmin: account.isAdmin,
	createdAt: account.createdAt,
	updatedAt: account.updatedAt,
});

// citext makes eq case-insensitive (same semantics as the unique constraint);
// the catch below guards races. normalizeEmail (libs/email) keeps stored data uniform.
export const authService = {
	async register(data: AuthRegister): Promise<AuthResponse> {
		const email = normalizeEmail(data.email);

		const existing = await db.query.accounts.findFirst({
			where: eq(accounts.email, email),
			columns: { id: true },
		});
		if (existing) throw Errors.conflict('This email is already registered');

		// Bootstrap: the FIRST registered account is the platform's initial
		// admin (zero-config — no ENV, no seed script). The pre-check has a
		// benign race (two concurrent first registrations both become admin),
		// which only affects a fresh database and only grants, never denies.
		const [countRow] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(accounts);
		const isFirstAccount = (countRow?.count ?? 0) === 0;

		// argon2id via Bun's built-in hashing — zero-dep, and the hash embeds its parameters.
		const passwordHash = await Bun.password.hash(data.password);

		try {
			const [row] = await db
				.insert(accounts)
				.values({
					name: data.name,
					email,
					passwordHash,
					isAdmin: isFirstAccount,
				})
				.returning();
			const account = pickAccount(row!);
			return {
				token: await signAuthToken({ accountId: account.id }),
				account,
			};
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw Errors.conflict('This email is already registered');
			}
			throw error;
		}
	},

	async login(data: AuthLogin): Promise<AuthResponse> {
		const email = normalizeEmail(data.email);
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.email, email),
		});

		// One message for every failure — never reveal whether the email exists.
		// Accounts without a password hash fail the same way.
		const invalid = () => Errors.unauthorized('Invalid email or password');

		if (!account || !account.passwordHash) throw invalid();
		const matches = await Bun.password.verify(
			data.password,
			account.passwordHash,
		);
		if (!matches) throw invalid();

		const publicAccount = pickAccount(account);
		return {
			token: await signAuthToken({ accountId: publicAccount.id }),
			account: publicAccount,
		};
	},

	// Guard already verified the token; re-read the row so renames apply immediately.
	async me(
		accountId: number,
		workspaceSlug: string | undefined,
	): Promise<MeResponse> {
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.id, accountId),
		});
		if (!account) {
			throw Errors.unauthorized('This account no longer exists');
		}

		// The token's workspaceSlug claim is echoed only while membership still
		// holds — a deleted workspace or removed member drops back to null (the
		// client re-picks) instead of lingering in a phantom workspace until the
		// token's TTL expires.
		let workspace: WorkspaceRef | null = null;
		if (workspaceSlug !== undefined) {
			const member = await db
				.select({
					slug: workspaces.slug,
					name: workspaces.name,
				})
				.from(workspaceMembers)
				.innerJoin(
					workspaces,
					eq(workspaceMembers.workspaceId, workspaces.id),
				)
				.where(
					and(
						eq(workspaceMembers.accountId, accountId),
						eq(workspaces.slug, workspaceSlug),
					),
				)
				.limit(1);
			if (member[0]) workspace = member[0];
		}

		return { account: pickAccount(account), workspace };
	},

	// Exchange for a workspace-scoped token. Membership is the gate: an account
	// can only enter workspaces it belongs to — 403, not 404, because whether
	// the workspace exists is not the question.
	async switchWorkspace({
		accountId,
		slug,
	}: {
		accountId: number;
		slug: string;
	}): Promise<SwitchWorkspaceResponse> {
		const member = await db
			.select({
				slug: workspaces.slug,
				name: workspaces.name,
			})
			.from(workspaceMembers)
			.innerJoin(
				workspaces,
				eq(workspaceMembers.workspaceId, workspaces.id),
			)
			.where(
				and(
					eq(workspaceMembers.accountId, accountId),
					eq(workspaces.slug, slug),
				),
			)
			.limit(1);
		if (!member[0]) {
			throw Errors.forbidden('You are not a member of this workspace');
		}
		return {
			token: await signAuthToken({ accountId, workspaceSlug: slug }),
			workspace: member[0],
		};
	},
};
