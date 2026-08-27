import { z } from 'zod';
import { tenantFieldSchemas } from '../shared';

export const tenantUpdateSchema = z
	.object(tenantFieldSchemas)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field is required',
	});
export type TenantUpdate = z.infer<typeof tenantUpdateSchema>;
