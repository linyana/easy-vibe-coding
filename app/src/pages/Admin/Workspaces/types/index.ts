import type { API, UseAPIItem } from '@/libs/api';

export type Workspace = UseAPIItem<typeof API.workspaces.admin.get>;

export type AdminWorkspacesAction =
	| { kind: 'create' }
	| { kind: 'edit'; workspace: Workspace }
	| { kind: 'members'; workspace: Workspace }
	| { kind: 'delete'; workspace: Workspace };
