import type { API, UseAPIItem } from '@/libs/api';
import type { MemberRole } from '@easy-vibe-coding/shared';

// Members live under the parameterized admin route (`admin({ id })`) — reach
// the list fn type via ReturnType instead of a call expression (unparseable
// inside a generic).
type MembersGet = ReturnType<typeof API.workspaces.admin>['members']['get'];

export type Member = UseAPIItem<MembersGet>;

export type MemberAction =
	| { kind: 'add' }
	| { kind: 'remove'; member: Member }
	| { kind: 'role'; member: Member; role: MemberRole };
