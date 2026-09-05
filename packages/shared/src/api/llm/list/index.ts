import { z } from 'zod';
import { llmProviderResponseSchema } from '../shared';

// GET /llm — the account's own provider rows. Unpaginated by design (a
// personal settings list is a handful of rows); the { items, total } shape
// still matches the list contract so the app types derive from the root GET.
export const llmListResponseSchema = z.object({
	items: z.array(llmProviderResponseSchema),
	total: z.number(),
});
export type LlmListResponse = z.infer<typeof llmListResponseSchema>;
