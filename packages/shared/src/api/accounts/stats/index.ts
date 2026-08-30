import { z } from 'zod';

export const accountStatsResponseSchema = z.object({
	total: z.number(),
	createdLast7Days: z.number(),
	createdLast30Days: z.number(),
});
export type AccountStatsResponse = z.infer<typeof accountStatsResponseSchema>;
