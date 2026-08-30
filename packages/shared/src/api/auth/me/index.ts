import { z } from 'zod';
import { accountResponseSchema } from '../../accounts/shared';
import { workspaceRefSchema } from '../../workspaces/shared';

// me = the session envelope: the account row plus the workspace the token is
// scoped to (echoed from the token's workspaceSlug claim — the server is the
// source of truth; the client never decodes the JWT, and never persists the
// workspace context across reloads).
export const meResponseSchema = z.object({
	account: accountResponseSchema,
	workspace: workspaceRefSchema.nullable(),
});
export type MeResponse = z.infer<typeof meResponseSchema>;
