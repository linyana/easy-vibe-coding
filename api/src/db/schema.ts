import { sql } from 'drizzle-orm';
import {
	boolean,
	customType,
	integer,
	jsonb,
	pgTable,
	text,
	unique,
} from 'drizzle-orm/pg-core';

// Wire is RFC 3339 UTC (matches the shared contract's `z.iso.datetime()`); the
// driver returns session-format strings, so fromDriver normalizes once here —
// no per-query conversion layer.
const timestamptz = customType<{ data: string; driverData: string }>({
	dataType: () => 'timestamptz',
	fromDriver: (value: string) => new Date(value).toISOString(),
	toDriver: (value: string) => value,
});

// citext: comparisons (and the unique constraint) are case-insensitive — email
// identity is case-insensitive BY COLUMN TYPE, so no query can forget it. The
// migration that enables this adds `CREATE EXTENSION IF NOT EXISTS citext`.
const citext = customType<{ data: string; driverData: string }>({
	dataType: () => 'citext',
	fromDriver: (value: string) => value,
	toDriver: (value: string) => value,
});

export const accounts = pgTable('accounts', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull(),
	email: citext('email').notNull().unique(),
	// Platform-level admin flag — the role guard re-reads it from the DB per
	// request (the row, not the token, is the source of truth), so revoking
	// admin takes effect immediately. Bootstrap: the first registered account
	// is created with it set (auth service); everyone after is a regular user.
	isAdmin: boolean('is_admin').notNull().default(false),
	// NOT NULL holds because every creation path (register and the Accounts page)
	// hashes an initial password (argon2id, same policy).
	passwordHash: text('password_hash').notNull(),
	// Session-revocation counter: bumped on password reset/change, embedded as
	// a claim in every issued token, and compared per request by the auth guard
	// — a token signed before the bump is rejected immediately (no TTL wait).
	tokenVersion: integer('token_version').notNull().default(0),
	createdAt: timestamptz('created_at')
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamptz('updated_at')
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => new Date().toISOString()),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export const workspaces = pgTable('workspaces', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	// The user-facing identity — unique, required, URL-safe. The integer PK
	// stays internal (FK integrity, rename safety); every API surface, token
	// claim, and the app address a workspace by its slug.
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	// Soft-delete flag (admin toggle): the row and memberships stay, but the
	// workspace behaves as deleted for non-admin members until re-enabled.
	disabled: boolean('disabled').notNull().default(false),
	createdAt: timestamptz('created_at')
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamptz('updated_at')
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => new Date().toISOString()),
});

export const workspaceMembers = pgTable(
	'workspace_members',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
		workspaceId: integer('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		accountId: integer('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		// Role is server-written; the account that creates a workspace becomes
		// its owner. Member-role semantics arrive with the members surface.
		// $type narrows the wire type to the contract's role union (owner/member)
		// without a DB enum — text stays the storage type.
		role: text('role')
			.notNull()
			.default('owner')
			.$type<'owner' | 'member'>(),
		createdAt: timestamptz('created_at')
			.notNull()
			.default(sql`now()`),
	},
	(table) => ({
		workspaceAccountUnique: unique().on(table.workspaceId, table.accountId),
	}),
);

// Platform-level settings — one row per settings module (the module name is
// the key), so adding a module is one insert, never a schema change. The value
// is schemaless JSON: reads merge stored values over the shared defaults
// (modules/admin/settings/service.ts), so field evolution needs no migration.
export const platformSettings = pgTable('platform_settings', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	key: text('key').notNull().unique(),
	value: jsonb('value').notNull(),
	createdAt: timestamptz('created_at')
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamptz('updated_at')
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => new Date().toISOString()),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;

// One row = one platform account (multiple Shopify accounts = multiple rows).
// `config` holds the platform-specific non-secret fields ({ shopUrl } |
// { storeHash }) as JSONB — adding a platform field needs no migration. The
// access token is NOT here: it has its own encrypted column (libs/crypto,
// AES-256-GCM) and never crosses the wire (responses carry `hasToken` only).
export const connections = pgTable('connections', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	workspaceId: integer('workspace_id')
		.notNull()
		.references(() => workspaces.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	// Bound at creation — edit never changes it (a platform switch means a
	// new connection). text + $type narrows to the shared platform union.
	platform: text('platform').notNull().$type<'shopify' | 'bigcommerce'>(),
	config: jsonb('config').notNull(),
	// AES-256-GCM ciphertext (libs/crypto encryptSecret) — plaintext token
	// never touches the DB.
	accessToken: text('access_token').notNull(),
	createdAt: timestamptz('created_at')
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamptz('updated_at')
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => new Date().toISOString()),
});

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
