import {
	switchWorkspaceSchema,
	switchWorkspaceResponseSchema,
} from '../../../auth/switch-workspace';
import type {
	SwitchWorkspace,
	SwitchWorkspaceResponse,
} from '../../../auth/switch-workspace';

// The admin counterpart of /auth/switch-workspace — same wire shape, but the
// gate is the platform admin role instead of workspace membership: an admin
// enters ANY workspace from the platform list, not just ones they belong to.
export {
	switchWorkspaceSchema as switchAdminWorkspaceSchema,
	switchWorkspaceResponseSchema as switchAdminWorkspaceResponseSchema,
};
export type {
	SwitchWorkspace as SwitchAdminWorkspace,
	SwitchWorkspaceResponse as SwitchAdminWorkspaceResponse,
};
