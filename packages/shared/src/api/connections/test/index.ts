import type { ConnectionIdParams } from '../shared';

export type TestConnectionParams = ConnectionIdParams;
// POST /connections/:id/test — response is the shared success shape
// (successResponseSchema, defined once under accounts and reused here).
