import { z } from 'zod';

export const accountResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type AccountResponse = z.infer<typeof accountResponseSchema>;

export const accountIdParamsSchema = z.object({
	id: z.coerce.number().int(),
});
export type AccountIdParams = z.infer<typeof accountIdParamsSchema>;

export const successResponseSchema = z.object({
	success: z.boolean(),
});
export type SuccessResponse = z.infer<typeof successResponseSchema>;
