import { z } from 'zod';
import { workspaceResponseSchema } from '../shared';

// The workspace picker (step 3) needs every workspace the account can enter —
// no pagination: membership counts are small and the surface is a chooser.
export const workspaceListResponseSchema = z.object({
	items: z.array(workspaceResponseSchema),
	total: z.number(),
});
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;
