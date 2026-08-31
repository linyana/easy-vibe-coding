import { z } from 'zod';
import { passwordFieldSchema } from '../../auth/shared';

export const accountFieldSchemas = {
	name: z.string().trim().min(1, 'Name is required').max(100),
	email: z.email('Please enter a valid email address'),
};

// Password stays OUT of accountFieldSchemas on purpose: edit (partial update)
// and auth register must not inherit it. The rule is the auth contract's, reused.
// isAdmin is out too: granting admin is a deliberate create-time choice, and
// after creation the flag changes ONLY via the dedicated PATCH /:id/admin
// endpoint — the generic edit PATCH must never carry it.
export const accountCreateSchema = z.object({
	...accountFieldSchemas,
	isAdmin: z.boolean(),
	password: passwordFieldSchema,
});
export type AccountCreate = z.infer<typeof accountCreateSchema>;
