import { z } from 'zod';

// Platform is not editable (a platform switch means a new connection). A blank
// accessToken means "keep the current token" — the form's empty placeholder.
export const connectionUpdateSchema = z
	.object({
		name: z.string().trim().min(1, 'Name is required').max(100).optional(),
		shopUrl: z.string().trim().min(1).optional(),
		storeHash: z.string().trim().min(1).optional(),
		accessToken: z.string().trim().min(1).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field is required',
	});
export type ConnectionUpdate = z.infer<typeof connectionUpdateSchema>;
