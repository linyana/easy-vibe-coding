import { z } from 'zod';
import { memberRoleSchema } from '../../shared';

// Change a member's role — the only field that can change on a membership.
export const memberAdminRoleUpdateSchema = z.object({
	role: memberRoleSchema,
});
export type MemberAdminRoleUpdate = z.infer<typeof memberAdminRoleUpdateSchema>;
