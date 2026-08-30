import { z } from 'zod';
import { passwordFieldSchema } from '../../auth/shared';

// Admin-only: force a new password for an account. The password never crosses
// back over the wire — the response is the generic success shape.
export const accountResetPasswordSchema = z.object({
	password: passwordFieldSchema,
});
export type AccountResetPassword = z.infer<typeof accountResetPasswordSchema>;
