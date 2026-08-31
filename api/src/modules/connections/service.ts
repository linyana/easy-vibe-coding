import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import type {
	ConnectionConfig,
	ConnectionCreate,
	ConnectionListQuery,
	ConnectionResponse,
	ConnectionUpdate,
} from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { connections } from '../../db/schema';
import { Errors } from '../../libs/error';
import { decryptSecret, encryptSecret } from '../../libs/crypto';
import { getPlatformClient } from './platforms';

// Wire shape: config (non-secret) echoed, token reduced to a boolean — the
// plaintext never leaves the encrypted column.
const toResponse = (
	row: typeof connections.$inferSelect,
): ConnectionResponse => ({
	id: row.id,
	name: row.name,
	platform: row.platform,
	config: row.config as ConnectionConfig,
	hasToken: !!row.accessToken,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
});

export const connectionService = {
	async list({
		workspaceId,
		query,
	}: {
		workspaceId: number;
		query: ConnectionListQuery;
	}) {
		const where = and(
			eq(connections.workspaceId, workspaceId),
			query.platform
				? eq(connections.platform, query.platform)
				: undefined,
			query.search
				? ilike(connections.name, `%${query.search}%`)
				: undefined,
		);
		const [rows, totalRows] = await Promise.all([
			db
				.select()
				.from(connections)
				.where(where)
				.orderBy(desc(connections.id))
				.limit(query.pageSize)
				.offset((query.page - 1) * query.pageSize),
			db
				.select({ count: sql<number>`count(*)` })
				.from(connections)
				.where(where),
		]);
		return {
			items: rows.map(toResponse),
			total: Number(totalRows[0]?.count ?? 0),
		};
	},

	// Test-then-connect: the shared create schema enforced the cross-field
	// rule (shopUrl for shopify, storeHash for bigcommerce) — this packs the
	// flat form fields into the config JSONB, VERIFIES the credentials
	// against the platform before any row exists (a bad token fails the
	// request, never lands in the DB), then encrypts the token.
	async create({
		workspaceId,
		data,
	}: {
		workspaceId: number;
		data: ConnectionCreate;
	}) {
		const config: ConnectionConfig =
			data.platform === 'shopify'
				? { shopUrl: data.shopUrl! }
				: { storeHash: data.storeHash! };
		await getPlatformClient(data.platform).testConnection(
			config,
			data.accessToken,
		);
		const [row] = await db
			.insert(connections)
			.values({
				workspaceId,
				name: data.name,
				platform: data.platform,
				config,
				accessToken: encryptSecret(data.accessToken),
			})
			.returning();
		return toResponse(row!);
	},

	async update({
		workspaceId,
		id,
		data,
	}: {
		workspaceId: number;
		id: number;
		data: ConnectionUpdate;
	}) {
		const existing = await db.query.connections.findFirst({
			where: and(
				eq(connections.id, id),
				eq(connections.workspaceId, workspaceId),
			),
		});
		if (!existing) throw Errors.notFound('Connection not found');

		// Test-then-save, scoped to actual credential changes: a name-only
		// edit skips the external call; a changed token OR platform field
		// verifies the MERGED credentials (form values, falling back to the
		// stored ones for what wasn't touched) before anything is written.
		const configChanged =
			data.shopUrl !== undefined || data.storeHash !== undefined;
		const tokenChanged = !!data.accessToken;
		if (configChanged || tokenChanged) {
			const storedConfig = existing.config as ConnectionConfig;
			const config: ConnectionConfig =
				existing.platform === 'shopify'
					? {
							shopUrl:
								data.shopUrl ??
								('shopUrl' in storedConfig
									? storedConfig.shopUrl
									: ''),
						}
					: {
							storeHash:
								data.storeHash ??
								('storeHash' in storedConfig
									? storedConfig.storeHash
									: ''),
						};
			const token =
				data.accessToken ?? decryptSecret(existing.accessToken);
			await getPlatformClient(existing.platform).testConnection(
				config,
				token,
			);
		}

		const patch: Partial<typeof connections.$inferInsert> = {};
		if (data.name !== undefined) patch.name = data.name;
		if (configChanged) {
			// The platform never changes on edit — the config is rebuilt for
			// the existing platform's shape.
			patch.config =
				existing.platform === 'shopify'
					? { shopUrl: data.shopUrl! }
					: { storeHash: data.storeHash! };
		}
		// Blank token on the form means "keep the current one" — undefined
		// here skips the update; the contract guarantees a non-empty string.
		if (data.accessToken)
			patch.accessToken = encryptSecret(data.accessToken);

		const [row] = await db
			.update(connections)
			.set(patch)
			.where(
				and(
					eq(connections.id, id),
					eq(connections.workspaceId, workspaceId),
				),
			)
			.returning();
		return toResponse(row!);
	},

	// Single-row delete is exact: deleting 0 rows means the row isn't there.
	async remove({ workspaceId, id }: { workspaceId: number; id: number }) {
		const deleted = await db
			.delete(connections)
			.where(
				and(
					eq(connections.id, id),
					eq(connections.workspaceId, workspaceId),
				),
			)
			.returning({ id: connections.id });
		if (deleted.length === 0) {
			throw Errors.notFound('Connection not found');
		}
		return { success: true };
	},

	// Live passthrough — read the workspace-scoped row, hand the decrypted
	// token to the platform client. No local storage, no sync task.
	async getProducts({
		workspaceId,
		id,
	}: {
		workspaceId: number;
		id: number;
	}) {
		const row = await db.query.connections.findFirst({
			where: and(
				eq(connections.id, id),
				eq(connections.workspaceId, workspaceId),
			),
		});
		if (!row) throw Errors.notFound('Connection not found');
		return getPlatformClient(row.platform).fetchProducts(
			row.config as ConnectionConfig,
			decryptSecret(row.accessToken),
		);
	},

	// Credential check — the platform client's lightest authenticated call;
	// throws via the unified error mapping when the token is rejected.
	async test({ workspaceId, id }: { workspaceId: number; id: number }) {
		const row = await db.query.connections.findFirst({
			where: and(
				eq(connections.id, id),
				eq(connections.workspaceId, workspaceId),
			),
		});
		if (!row) throw Errors.notFound('Connection not found');
		await getPlatformClient(row.platform).testConnection(
			row.config as ConnectionConfig,
			decryptSecret(row.accessToken),
		);
		return { success: true };
	},
};
