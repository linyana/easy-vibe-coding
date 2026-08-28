import type {
	WorkspaceMemberParams,
	WorkspaceMemberResponse,
} from '../../shared';

// DELETE /workspaces/:workspaceSlug/members/:userId — the removed membership
// row is the response (mirrors the shared contract; no success-wrapper schema
// here).
export type DeleteWorkspaceMemberParams = WorkspaceMemberParams;
export type DeleteWorkspaceMemberResponse = WorkspaceMemberResponse;
