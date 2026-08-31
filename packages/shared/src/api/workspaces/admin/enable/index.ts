import { workspaceResponseSchema } from '../../shared';

// POST /workspaces/admin/:id/enable — clears the soft-delete flag, restoring
// the workspace to full access for its members. Response is the updated
// workspace.
export const enableWorkspaceResponseSchema = workspaceResponseSchema;
