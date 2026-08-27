import { z } from 'zod';
import { tenantFieldSchemas } from '../shared';

export const tenantCreateSchema = z.object(tenantFieldSchemas);
export type TenantCreate = z.infer<typeof tenantCreateSchema>;
