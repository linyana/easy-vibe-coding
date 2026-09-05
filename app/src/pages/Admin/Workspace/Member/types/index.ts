import type { API, UseAPIItem } from '@/libs/api';
import type { MemberRole } from '@easy-vibe-coding/shared';

// Members of the admin's entered workspace — addressed by the URL slug
// (/admin/workspaces/:slug/*): the route writes the request-scope slug, the
// workspace guard resolves it per request. Never an id param.
type MembersGet = typeof API.admin.workspaces.members.get;

export type Member = UseAPIItem<MembersGet>;

export type MemberAction =
	| { kind: 'add' }
	| { kind: 'remove'; member: Member }
	| { kind: 'role'; member: Member; role: MemberRole };
