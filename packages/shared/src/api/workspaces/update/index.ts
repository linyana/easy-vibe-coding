import { z } from 'zod';
import { workspaceFieldSchemas } from '../shared';

export const workspaceUpdateSchema = z
	.object(workspaceFieldSchemas)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field is required',
	});
export type WorkspaceUpdate = z.infer<typeof workspaceUpdateSchema>;
