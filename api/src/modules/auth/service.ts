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
				token: await signAuthToken({
					accountId: account.id,
					tokenVersion: row!.tokenVersion,
				}),
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
			token: await signAuthToken({
				accountId: publicAccount.id,
				tokenVersion: account.tokenVersion,
			}),
			account: publicAccount,
		};
	},

	// Guard already verified the token; re-read the row so renames apply immediately.
	async me(
		accountId: number,
		workspaceId: number | undefined,
	): Promise<MeResponse> {
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.id, accountId),
		});
		if (!account) {
			throw Errors.unauthorized('This account no longer exists');
		}

		// The token's workspaceId claim is echoed only while the workspace
		// still exists, (for regular accounts) membership still holds, and the
		// workspace is not soft-deleted — a deleted or disabled workspace or a
		// removed member drops back to null (the client re-picks) instead of
		// lingering in a phantom workspace until the token's TTL expires.
		// Admins echo ANY workspace: the platform switch lets them enter
		// workspaces they don't belong to, so membership can't be the gate for
		// them, and a disabled workspace is theirs to inspect and re-enable.
		let workspace: WorkspaceRef | null = null;
		if (workspaceId !== undefined) {
			if (account.isAdmin) {
				const row = await db.query.workspaces.findFirst({
					where: eq(workspaces.id, workspaceId),
					columns: { id: true, slug: true, name: true },
				});
				if (row) workspace = row;
			} else {
				const member = await db
					.select({
						id: workspaces.id,
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
							eq(workspaceMembers.workspaceId, workspaceId),
							eq(workspaces.disabled, false),
						),
					)
					.limit(1);
				if (member[0]) workspace = member[0];
			}
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
				id: workspaces.id,
				slug: workspaces.slug,
				name: workspaces.name,
				disabled: workspaces.disabled,
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
		// Soft-delete gate (same rule as the role guard): a closed workspace
		// rejects non-admin members; admins keep the override (their own switch
		// endpoint and surfaces stay open). tokenVersion rides on the fresh
		// token so a reset password still revokes this new session.
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.id, accountId),
			columns: { isAdmin: true, tokenVersion: true },
		});
		if (member[0].disabled && !account?.isAdmin) {
			throw Errors.forbidden('This workspace has been disabled');
		}
		return {
			token: await signAuthToken({
				accountId,
				workspaceId: member[0].id,
				tokenVersion: account?.tokenVersion ?? 0,
			}),
			workspace: member[0],
		};
	},
};
