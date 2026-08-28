import type { WorkspaceSlugParams, WorkspaceWithRole } from '../shared';

// GET /workspaces/:workspaceSlug — reuses the shared contract (params +
// workspace+role response); this folder keeps the "one folder per endpoint"
// structure.
export type GetWorkspaceParams = WorkspaceSlugParams;
export type GetWorkspaceResponse = WorkspaceWithRole;
