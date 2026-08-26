import { z } from 'zod';
import { userResponseSchema } from '../shared';

export const userListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
	// HALF-OPEN range — the client commits the start of the picked "from" day
	// and the start of the day after "to" (server compares `lt`); the server
	// never guesses a timezone.
	createdRange: z
		.object({
			from: z.iso.datetime().optional(),
			to: z.iso.datetime().optional(),
		})
		.optional()
		.catch(undefined),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const userListResponseSchema = z.object({
	items: z.array(userResponseSchema),
	total: z.number(),
});
export type UserListResponse = z.infer<typeof userListResponseSchema>;
