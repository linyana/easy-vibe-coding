import { z } from 'zod';
import { accountResponseSchema } from '../../accounts/shared';

// The password policy — enforced wherever a password is created; login only checks presence.
export const passwordFieldSchema = z
	.string()
	.min(8, 'Password must be at least 8 characters')
	.max(128, 'Password must be at most 128 characters');

export const authResponseSchema = z.object({
	token: z.string(),
	account: accountResponseSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
