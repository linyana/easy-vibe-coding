import { z } from 'zod';

export const userResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string(),
	// Global platform role — gates the /users module and admin tenant views.
	// Not settable via create/update (promotion is a manual DB op).
	isAdmin: z.boolean(),
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
