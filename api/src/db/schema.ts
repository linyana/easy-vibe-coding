import { sql, type BuildExtraConfigColumns } from 'drizzle-orm';
import {
	boolean,
	customType,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	type PgColumnBuilderBase,
	type PgTableExtraConfigValue,
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

export const users = pgTable('users', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull(),
	email: citext('email').notNull().unique(),
	// NOT NULL holds because every creation path (register and the Users page)
	// hashes an initial password (argon2id, same policy).
	passwordHash: text('password_hash').notNull(),
	// Global platform role: gates /users management and admin workspace views.
	// Never set via the API — promotion is a manual DB op (documented).
	isAdmin: boolean('is_admin').notNull().default(false),
	createdAt: timestamptz('created_at')
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamptz('updated_at')
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => new Date().toISOString()),
});

// Multi-tenancy: `workspaces` is the isolation unit; `workspace_members` is
// the N:M relation between a user and the workspaces they belong to — the
// composite PK is the anti-join-dup constraint, cascades keep orphan rows
// impossible on either side. Business tables are workspace-scoped through
// workspaceScopedTable below. `slug` is the stable public identifier (URLs,
// API paths); the numeric id stays internal (FK target only).
export const workspaces = pgTable('workspaces', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
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

// The workspace_id column every business table carries — defined once so the
// isolation convention can't drift: notNull + FK cascade (a deleted workspace
// takes its data with it).
const workspaceIdColumn = () =>
	integer('workspace_id')
		.notNull()
		.references(() => workspaces.id, { onDelete: 'cascade' });

// Workspace-scoped business tables are built through this factory — identity
// PK, workspace_id FK and the index every workspace-scoped query needs come
// for free, so a new table can't forget the isolation column. Extra
// constraints (uniques, composite keys) go in the extraConfig callback, same
// shape as pgTable.
export function workspaceScopedTable<
	TTableName extends string,
	TColumns extends Record<string, PgColumnBuilderBase>,
>(
	tableName: TTableName,
	columns: TColumns,
	extraConfig?: (
		table: BuildExtraConfigColumns<
			TTableName,
			TColumns & {
				id: PgColumnBuilderBase;
				workspaceId: PgColumnBuilderBase;
			},
			'pg'
		>,
	) => PgTableExtraConfigValue[],
) {
	return pgTable(
		tableName,
		{
			id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
			workspaceId: workspaceIdColumn(),
			...columns,
		},
		(table) => [
			index(`${tableName}_workspace_id_idx`).on(table.workspaceId),
			...(extraConfig?.(table) ?? []),
		],
	);
}

export const workspaceMembers = pgTable(
	'workspace_members',
	{
		workspaceId: workspaceIdColumn(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		// Role is set server-side only (owner on create, member on add) — the
		// wire's z.enum validates it, the DB stores text.
		role: text('role').notNull(),
		createdAt: timestamptz('created_at')
			.notNull()
			.default(sql`now()`),
	},
	(t) => [primaryKey({ columns: [t.workspaceId, t.userId] })],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
