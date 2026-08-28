import type { API, UseAPIItem } from '@/libs/api';

export type Workspace = UseAPIItem<typeof API.workspaces.get>;

// The members list lives under /workspaces/:workspaceSlug — derive its item
// type through the path-scoped router (same single source: the Eden client).
export type WorkspaceMember = UseAPIItem<
	ReturnType<typeof API.workspaces>['members']['get']
>;

export type WorkspacesAction =
	| { kind: 'create' }
	| { kind: 'detail'; workspace: Workspace }
	| { kind: 'rename'; workspace: Workspace };

export type WorkspacesMembersAction =
	| { kind: 'addMember' }
	| { kind: 'removeMember'; member: WorkspaceMember };
