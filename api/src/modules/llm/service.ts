import { desc, eq } from 'drizzle-orm';
import type {
	LlmApiKind,
	LlmPresetId,
	LlmProviderCreate,
	LlmProviderResponse,
	LlmProviderUpdate,
} from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { llmProviders, llmSelections } from '../../db/schema';
import { Errors } from '../../libs/error';
import { decryptSecret, encryptSecret } from '../../libs/crypto';
import {
	fetchModelsFromProvider,
	isOpenAIFamily,
	presetById,
} from '../../libs/llm';

// Wire shape: encrypted key reduced to a suffix — the plaintext never leaves
// the encrypted column.
const toProviderResponse = (
	row: typeof llmProviders.$inferSelect,
): LlmProviderResponse => ({
	id: row.id,
	preset: row.preset as LlmPresetId | null,
	api: row.api as LlmApiKind,
	name: row.name,
	baseUrl: row.baseUrl,
	keySuffix: row.keySuffix,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
});

export const llmService = {
	// Personal (account-scoped): the account's own provider rows, newest first.
	// Unpaginated — a handful of rows in a settings dialog.
	async list(accountId: number) {
		const items = await db
			.select()
			.from(llmProviders)
			.where(eq(llmProviders.accountId, accountId))
			.orderBy(desc(llmProviders.id));
		return { items: items.map(toProviderResponse), total: items.length };
	},

	// Pure storage by design (no network test): the key is verified the first
	// time it is actually used — e.g. a model-list fetch. A preset row stores
	// the registry's api/name/baseUrl snapshot; a custom row stores the user's.
	async create({
		accountId,
		data,
	}: {
		accountId: number;
		data: LlmProviderCreate;
	}) {
		const preset = data.preset ? presetById(data.preset) : undefined;
		const api = preset?.api ?? data.api;
		const name = preset?.name ?? data.name ?? '';
		const baseUrl = preset?.baseUrl ?? data.baseUrl ?? '';
		if (!api || !name || !baseUrl) {
			throw Errors.badRequest('Incomplete custom provider settings');
		}
		const [row] = await db
			.insert(llmProviders)
			.values({
				accountId,
				preset: data.preset ?? null,
				api,
				name,
				baseUrl,
				apiKey: encryptSecret(data.apiKey),
				keySuffix: data.apiKey.slice(-4),
			})
			.returning();
		return toProviderResponse(row!);
	},

	// Key rotation for every row; name/api/baseUrl edits only for custom rows
	// (a preset's endpoint is registry-fixed — change of supplier = new row).
	async update({
		accountId,
		id,
		data,
	}: {
		accountId: number;
		id: number;
		data: LlmProviderUpdate;
	}) {
		const existing = await db.query.llmProviders.findFirst({
			where: eq(llmProviders.id, id),
		});
		if (!existing || existing.accountId !== accountId) {
			throw Errors.notFound('LLM provider not found');
		}
		if (
			existing.preset !== null &&
			(data.name !== undefined ||
				data.api !== undefined ||
				data.baseUrl !== undefined)
		) {
			throw Errors.badRequest(
				'Preset providers only support replacing the API key',
			);
		}

		const patch: Partial<typeof llmProviders.$inferInsert> = {};
		if (data.apiKey !== undefined) {
			patch.apiKey = encryptSecret(data.apiKey);
			patch.keySuffix = data.apiKey.slice(-4);
		}
		if (data.name !== undefined) patch.name = data.name;
		if (data.api !== undefined) patch.api = data.api;
		if (data.baseUrl !== undefined) patch.baseUrl = data.baseUrl;

		const [row] = await db
			.update(llmProviders)
			.set(patch)
			.where(eq(llmProviders.id, id))
			.returning();
		return toProviderResponse(row!);
	},

	// Precise single-row delete: removing a provider also removes the account's
	// default selection if it pointed here (FK cascade) — no stale default.
	async remove({ accountId, id }: { accountId: number; id: number }) {
		const [row] = await db
			.delete(llmProviders)
			.where(eq(llmProviders.id, id))
			.returning();
		if (!row || row.accountId !== accountId) {
			throw Errors.notFound('LLM provider not found');
		}
		return { success: true };
	},

	async getSelection(accountId: number) {
		const selection = await db.query.llmSelections.findFirst({
			where: eq(llmSelections.accountId, accountId),
		});
		if (!selection) return { selection: null };
		const provider = await db.query.llmProviders.findFirst({
			where: eq(llmProviders.id, selection.providerId),
		});
		if (!provider || provider.accountId !== accountId) {
			return { selection: null };
		}
		return {
			selection: { providerId: provider.id, model: selection.model },
		};
	},

	// Upsert (one selection per account). Only live-data rules run here: the
	// provider must be the account's own. The model is any id the user typed
	// or picked from a fetched list — no static catalog gate.
	async setSelection({
		accountId,
		data,
	}: {
		accountId: number;
		data: { providerId: number; model: string };
	}) {
		const provider = await db.query.llmProviders.findFirst({
			where: eq(llmProviders.id, data.providerId),
		});
		if (!provider || provider.accountId !== accountId) {
			throw Errors.notFound('LLM provider not found');
		}
		await db
			.insert(llmSelections)
			.values({
				accountId,
				providerId: data.providerId,
				model: data.model,
			})
			.onConflictDoUpdate({
				target: llmSelections.accountId,
				set: {
					providerId: data.providerId,
					model: data.model,
					updatedAt: new Date().toISOString(),
				},
			});
		return {
			selection: { providerId: data.providerId, model: data.model },
		};
	},

	async clearSelection(accountId: number) {
		await db
			.delete(llmSelections)
			.where(eq(llmSelections.accountId, accountId));
		return { success: true };
	},

	// Live model list for one row — the stored key is used against the
	// row's own baseUrl (SSRF-guarded in libs/llm). anthropic-messages
	// providers expose no /models endpoint, so there is nothing to fetch.
	async models({ accountId, id }: { accountId: number; id: number }) {
		const provider = await db.query.llmProviders.findFirst({
			where: eq(llmProviders.id, id),
		});
		if (!provider || provider.accountId !== accountId) {
			throw Errors.notFound('LLM provider not found');
		}
		const api = provider.api as LlmApiKind;
		if (!isOpenAIFamily(api)) {
			throw Errors.badRequest(
				'This provider does not expose a model list — enter the model id manually.',
			);
		}
		try {
			return {
				items: await fetchModelsFromProvider({
					baseUrl: provider.baseUrl,
					apiKey: decryptSecret(provider.apiKey),
				}),
			};
		} catch (error) {
			throw Errors.badRequest(
				error instanceof Error
					? error.message
					: 'Could not fetch the model list',
			);
		}
	},
};
