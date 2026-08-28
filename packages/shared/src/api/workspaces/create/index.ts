import { z } from 'zod';
import { workspaceFieldSchemas } from '../shared';

// Name only — the server derives the slug from it (slugify, collision-safe).
// The slug is the workspace's stable public id; it isn't user-writable here.
export const workspaceCreateSchema = z.object(workspaceFieldSchemas);
export type WorkspaceCreate = z.infer<typeof workspaceCreateSchema>;
