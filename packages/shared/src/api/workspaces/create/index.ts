import { z } from 'zod';

export const workspaceCreateSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(100),
});
export type WorkspaceCreate = z.infer<typeof workspaceCreateSchema>;
