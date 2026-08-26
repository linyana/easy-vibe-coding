import { z } from 'zod';

export const userResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export const userIdParamsSchema = z.object({
	id: z.coerce.number().int(),
});
export type UserIdParams = z.infer<typeof userIdParamsSchema>;

export const successResponseSchema = z.object({
	success: z.boolean(),
});
export type SuccessResponse = z.infer<typeof successResponseSchema>;
