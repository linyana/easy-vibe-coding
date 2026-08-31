import { z } from 'zod';

// Path params for member endpoints: only the member's account id — the
// workspace is NOT in the URL. It comes from the session: the `workspace`
// guard resolves the token's workspaceSlug claim, so these routes can only
// address the workspace the admin entered.
export const memberAdminAccountParamsSchema = z.object({
	accountId: z.coerce.number().int(),
});
export type MemberAdminAccountParams = z.infer<
	typeof memberAdminAccountParamsSchema
>;
