import type { WorkspaceRole } from '@easy-vibe-coding/shared';
import { Errors } from '../error';

// Workspace-scoped write gates, shared by every workspace-scoped module.
// `role` is the acting user's membership role — null when the platform admin
// bypassed the membership check in workspaceScope; `isAdmin` is the global
// platform role. Two helpers because admin bypasses SOME owner gates
// (entity-level writes) but not others (member management): the caller picks
// which applies. Neither lets a plain member through.
export const assertOwner = (role: WorkspaceRole | null, message: string) => {
	if (role !== 'owner') throw Errors.forbidden(message);
};

export const assertOwnerOrAdmin = (
	role: WorkspaceRole | null,
	isAdmin: boolean,
	message: string,
) => {
	if (role !== 'owner' && !isAdmin) throw Errors.forbidden(message);
};
