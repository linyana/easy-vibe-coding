import { z } from 'zod';
import { userFieldSchemas } from '../../../users/create';

// Members are identified by email — the natural product flow ("add someone
// by their address"); users.email is citext, so lookups are case-insensitive
// at the DB level and the service never normalizes.
export const tenantMemberCreateSchema = z.object({
	email: userFieldSchemas.email,
});
export type TenantMemberCreate = z.infer<typeof tenantMemberCreateSchema>;
