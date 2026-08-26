import { z } from 'zod';

export const userBatchDeleteSchema = z.object({
	ids: z.array(z.number().int()).min(1).max(100),
});
export type UserBatchDelete = z.infer<typeof userBatchDeleteSchema>;

export const userBatchDeleteResponseSchema = z.object({
	deleted: z.number().int(),
});
export type UserBatchDeleteResponse = z.infer<
	typeof userBatchDeleteResponseSchema
>;
