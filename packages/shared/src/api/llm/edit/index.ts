import { z } from 'zod';
import { llmApiKindSchema } from '../presets';

// PATCH /llm/:id — a preset row only accepts a new apiKey (kind/endpoint are
// registry-fixed); a custom row additionally accepts name / api / baseUrl.
// Omitted fields keep their stored values; an all-empty patch is invalid.
export const llmProviderUpdateSchema = z
	.object({
		apiKey: z
			.string()
			.trim()
			.min(4, 'API key is required')
			.max(500, 'API key is too long')
			.optional(),
		name: z.string().trim().min(1, 'Name is required').max(100).optional(),
		api: llmApiKindSchema.optional(),
		baseUrl: z
			.string()
			.trim()
			.refine(
				(v) => !v || /^https?:\/\//.test(v),
				'Base URL must start with http:// or https://',
			)
			.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'No changes to save',
	});
export type LlmProviderUpdate = z.infer<typeof llmProviderUpdateSchema>;
