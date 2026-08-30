import { z } from 'zod';

// Admin-only: platform-level workspace counts (mirrors the accounts stats shape).
export const workspaceStatsResponseSchema = z.object({
	total: z.number(),
	createdLast7Days: z.number(),
	createdLast30Days: z.number(),
});
export type WorkspaceStatsResponse = z.infer<
	typeof workspaceStatsResponseSchema
>;
