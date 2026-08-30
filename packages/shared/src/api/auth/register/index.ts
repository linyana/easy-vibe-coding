import { z } from 'zod';
import { accountFieldSchemas } from '../../accounts/create';
import { passwordFieldSchema } from '../shared';

export const authRegisterSchema = z.object({
	name: accountFieldSchemas.name,
	email: accountFieldSchemas.email,
	password: passwordFieldSchema,
});
export type AuthRegister = z.infer<typeof authRegisterSchema>;
