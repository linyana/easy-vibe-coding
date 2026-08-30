import { z } from 'zod';
import { workspaceFieldSchemas } from '../../create';

// Admin-only: partial workspace update — name/slug from the shared field
// base (never mirrored). The non-empty refine closes the "empty update
// counts as success" hole.
export const workspaceUpdateSchema = z
	.object(workspaceFieldSchemas)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field is required',
	});
export type WorkspaceUpdate = z.infer<typeof workspaceUpdateSchema>;
