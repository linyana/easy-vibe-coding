import { z } from 'zod';
import { llmApiKindSchema, llmPresetIdSchema } from '../presets';

// One provider row = one saved credential. A row is either a built-in preset
// (preset set; api/baseUrl/name echo the registry) or a custom supplier
// (preset null; api/baseUrl/name stored on the row). The key itself never
// crosses the wire — keySuffix (last 4 plaintext chars, captured at write)
// is the only key-derived echo.
export const llmProviderResponseSchema = z.object({
	id: z.number(),
	preset: llmPresetIdSchema.nullable(),
	api: llmApiKindSchema,
	name: z.string(),
	baseUrl: z.string(),
	keySuffix: z.string().length(4),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type LlmProviderResponse = z.infer<typeof llmProviderResponseSchema>;

// Path param reused by edit / delete / fetch-models.
export const llmProviderIdParamsSchema = z.object({
	id: z.coerce.number().int(),
});
export type LlmProviderIdParams = z.infer<typeof llmProviderIdParamsSchema>;
