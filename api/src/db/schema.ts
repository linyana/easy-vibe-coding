import { sql } from 'drizzle-orm';
import {
	boolean,
	customType,
	integer,
	pgTable,
	primaryKey,
	text,
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
	// Global platform role: gates /users management and admin tenant views.
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

// Multi-tenancy: `tenants` is the isolation unit (every future business table
// carries a tenant_id column); `tenant_members` is the N:M relation between a
// user and the tenants they belong to — the composite PK is the anti-join-dup
// constraint, cascades keep orphan rows impossible on either side.
export const tenants = pgTable('tenants', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull(),
	createdAt: timestamptz('created_at')
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamptz('updated_at')
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => new Date().toISOString()),
});

export const tenantMembers = pgTable(
	'tenant_members',
	{
		tenantId: integer('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
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
	(t) => [primaryKey({ columns: [t.tenantId, t.userId] })],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantMember = typeof tenantMembers.$inferSelect;
export type NewTenantMember = typeof tenantMembers.$inferInsert;
