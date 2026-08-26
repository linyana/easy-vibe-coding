import { z } from 'zod';

export const userStatsResponseSchema = z.object({
	total: z.number(),
	createdLast7Days: z.number(),
	createdLast30Days: z.number(),
});
export type UserStatsResponse = z.infer<typeof userStatsResponseSchema>;
