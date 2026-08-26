import { z } from 'zod';
import { userFieldSchemas } from '../create';

export const userUpdateSchema = z
	.object(userFieldSchemas)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field is required',
	});
export type UserUpdate = z.infer<typeof userUpdateSchema>;
