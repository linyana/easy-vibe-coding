import { z } from 'zod';
import { accountFieldSchemas } from '../../accounts/create';

// Password is presence-only: the server's verify is authoritative, and a wrong
// password reads as "invalid credentials" (its 401), not a client-side policy error.
export const authLoginSchema = z.object({
	email: accountFieldSchemas.email,
	password: z.string().min(1, 'Password is required'),
});
export type AuthLogin = z.infer<typeof authLoginSchema>;
