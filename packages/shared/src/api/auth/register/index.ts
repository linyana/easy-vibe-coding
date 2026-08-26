import { z } from 'zod';
import { userFieldSchemas } from '../../users/create';
import { passwordFieldSchema } from '../shared';

export const authRegisterSchema = z.object({
	name: userFieldSchemas.name,
	email: userFieldSchemas.email,
	password: passwordFieldSchema,
});
export type AuthRegister = z.infer<typeof authRegisterSchema>;
