import { z } from 'zod';

// Add a member by email (unique, case-insensitive — the account row is looked
// up by it; missing account → 404, duplicate → 409). The workspace keeps its
// invariant "no owner-less workspace" server-side.
export const memberAdminAddSchema = z.object({
	email: z.email('Please enter a valid email address'),
});
export type MemberAdminAdd = z.infer<typeof memberAdminAddSchema>;
