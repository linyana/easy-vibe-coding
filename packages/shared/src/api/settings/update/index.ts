import { settingsPayloadSchema } from '../shared';

// PUT /settings — write one module's config. The body is the same union as
// the GET response; the response is the config re-read after the upsert
// (server truth — the frontend adopts it as its new dirty baseline).
export const settingsUpdateSchema = settingsPayloadSchema;

export const settingsUpdateResponseSchema = settingsPayloadSchema;
