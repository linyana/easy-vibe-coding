import { z } from 'zod';

// POST /llm/:id/models — live model fetch for one provider row (uses the
// stored key against the stored baseUrl). The list is never persisted: it is
// fetched on demand and the user picks or types a model id.
export const llmProviderModelsResponseSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1).max(200),
		}),
	),
});
export type LlmProviderModelsResponse = z.infer<
	typeof llmProviderModelsResponseSchema
>;
