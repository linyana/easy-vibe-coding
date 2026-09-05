import { z } from 'zod';
import { llmApiKindSchema, llmPresetIdSchema } from '../presets';

// POST /llm — two shapes behind one schema:
//   preset mode: { preset, apiKey } — api/name/baseUrl are registry-derived.
//   custom mode: { apiKey, name, api, baseUrl } — preset absent.
// The superRefine picks the mode by presence of `preset` and anchors the
// custom-field issues on their own paths (field-level form display).
export const llmProviderCreateSchema = z
	.object({
		preset: llmPresetIdSchema.optional(),
		name: z.string().trim().optional(),
		api: llmApiKindSchema.optional(),
		baseUrl: z
			.string()
			.trim()
			.refine(
				(v) => !v || /^https?:\/\//.test(v),
				'Base URL must start with http:// or https://',
			)
			.optional(),
		apiKey: z
			.string()
			.trim()
			.min(4, 'API key is required')
			.max(500, 'API key is too long'),
	})
	.superRefine((data, ctx) => {
		if (data.preset) return;
		const nothingCustom = !data.name && !data.api && !data.baseUrl;
		if (nothingCustom) {
			// Neither a preset nor custom fields — the form is in preset mode
			// but nothing was picked.
			ctx.addIssue({
				code: 'custom',
				message:
					'Choose a provider preset or fill in the custom fields',
			});
			return;
		}
		if (!data.name)
			ctx.addIssue({
				code: 'custom',
				path: ['name'],
				message: 'Name is required for a custom provider',
			});
		if (!data.api)
			ctx.addIssue({
				code: 'custom',
				path: ['api'],
				message: 'Pick an API compatibility for a custom provider',
			});
		if (!data.baseUrl)
			ctx.addIssue({
				code: 'custom',
				path: ['baseUrl'],
				message: 'Base URL is required for a custom provider',
			});
	});
export type LlmProviderCreate = z.infer<typeof llmProviderCreateSchema>;
