import { z } from 'zod';

export const accountBatchDeleteSchema = z.object({
	ids: z.array(z.number().int()).min(1).max(100),
});
export type AccountBatchDelete = z.infer<typeof accountBatchDeleteSchema>;

export const accountBatchDeleteResponseSchema = z.object({
	deleted: z.number().int(),
});
export type AccountBatchDeleteResponse = z.infer<
	typeof accountBatchDeleteResponseSchema
>;
