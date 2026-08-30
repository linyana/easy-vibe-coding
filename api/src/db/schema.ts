import { sql } from 'drizzle-orm';
import {
	customType,
	integer,
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
	// NOT NULL holds because every creation path (register and the Accounts page)
	// hashes an initial password (argon2id, same policy).
	passwordHash: text('password_hash').notNull(),
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
		role: text('role').notNull().default('owner'),
		createdAt: timestamptz('created_at')
			.notNull()
			.default(sql`now()`),
	},
	(table) => ({
		workspaceAccountUnique: unique().on(table.workspaceId, table.accountId),
	}),
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
