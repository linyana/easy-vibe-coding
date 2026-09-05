import { z } from 'zod';
import { accountResponseSchema } from '../../accounts/shared';

// me = the authenticated account. The workspace is deliberately NOT part of
// the session envelope anymore: workspace pages address the workspace by URL
// slug, and the server resolves + re-validates it per request (the
// X-Workspace-Slug header). The client never decodes the JWT and never keeps
// a session-scoped workspace.
export const meResponseSchema = z.object({
	account: accountResponseSchema,
});
export type MeResponse = z.infer<typeof meResponseSchema>;
