import type { API, UseAPIItem } from '@/libs/api';
import type { MemberRole } from '@easy-vibe-coding/shared';

// Members live under the admin route without a workspace id — the workspace
// comes from the session (adminWorkspace guard resolves the token's slug
// claim), not the URL.
type MembersGet = typeof API.workspaces.admin.members.get;

export type Member = UseAPIItem<MembersGet>;

export type MemberAction =
	| { kind: 'add' }
	| { kind: 'remove'; member: Member }
	| { kind: 'role'; member: Member; role: MemberRole };
