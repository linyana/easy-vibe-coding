import { z } from 'zod';
import { settingsModuleSchema, settingsPayloadSchema } from '../shared';

// GET /settings — read one module's config. Stored values are merged over
// the shared defaults server-side, so the response is always complete and
// well-typed even when the module was never saved.
export const settingsGetQuerySchema = z.object({
	module: settingsModuleSchema,
});
export type SettingsGetQuery = z.infer<typeof settingsGetQuerySchema>;

export const settingsGetResponseSchema = settingsPayloadSchema;
