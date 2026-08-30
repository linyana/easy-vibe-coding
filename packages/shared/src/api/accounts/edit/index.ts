import { z } from 'zod';
import { accountFieldSchemas } from '../create';

export const accountUpdateSchema = z
	.object(accountFieldSchemas)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field is required',
	});
export type AccountUpdate = z.infer<typeof accountUpdateSchema>;
