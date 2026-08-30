import { z } from 'zod';
import { memberResponseSchema } from '../shared';

// Members surface is a read-only list of the current workspace — no search or
// pagination: membership counts are small, the page is a roster.
export const memberListResponseSchema = z.object({
	items: z.array(memberResponseSchema),
	total: z.number(),
});
export type MemberListResponse = z.infer<typeof memberListResponseSchema>;
