import { sql } from 'drizzle-orm';
import { customType, integer, pgTable, text } from 'drizzle-orm/pg-core';

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
