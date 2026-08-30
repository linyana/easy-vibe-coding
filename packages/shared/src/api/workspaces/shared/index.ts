import { z } from 'zod';

export const workspaceResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;
