import { z } from 'zod';

// The account's default model choice — one per account (unique accountId on
// the llm_selections row). providerId points at one of the account's own
// provider rows; model is a model id of that provider (typed by the user, or
// picked from a live-fetched list — both are accepted, so no static catalog
// gate here).
export const llmSelectionSchema = z.object({
	providerId: z.number(),
	model: z.string(),
});
export type LlmSelection = z.infer<typeof llmSelectionSchema>;

// GET /llm/selection — null when the account has no default yet.
export const llmSelectionGetResponseSchema = z.object({
	selection: llmSelectionSchema.nullable(),
});
export type LlmSelectionGetResponse = z.infer<
	typeof llmSelectionGetResponseSchema
>;

// PUT /llm/selection — provider row ownership is checked in the service.
export const llmSelectionUpsertSchema = z.object({
	providerId: z.number().int(),
	model: z.string().trim().min(1, 'Model is required').max(200),
});
export type LlmSelectionUpsert = z.infer<typeof llmSelectionUpsertSchema>;

// PUT echoes the stored view (same shape as GET).
export type LlmSelectionUpsertResponse = LlmSelectionGetResponse;
