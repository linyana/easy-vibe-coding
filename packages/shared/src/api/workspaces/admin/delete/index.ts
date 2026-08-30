import type { WorkspaceIdParams } from '../../shared';

// DELETE /workspaces/admin/:id — deletes the workspace; memberships cascade
// (onDelete: 'cascade'), the response is the generic success shape.
export type DeleteWorkspaceParams = WorkspaceIdParams;
