import { z } from 'zod';

// Targeted admin-grant/revoke — the ONLY way the platform-admin flag changes
// after creation. The generic edit PATCH never carries isAdmin, so editing an
// account can't accidentally flip admin access.
export const accountAdminSchema = z.object({
	isAdmin: z.boolean(),
});
export type AccountAdmin = z.infer<typeof accountAdminSchema>;
