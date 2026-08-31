import { workspaceResponseSchema } from '../../shared';

// POST /workspaces/admin/:id/disable — flips the soft-delete flag on. The
// workspace keeps its row and memberships but behaves as deleted for
// non-admin members until re-enabled. Response is the updated workspace.
export const disableWorkspaceResponseSchema = workspaceResponseSchema;
