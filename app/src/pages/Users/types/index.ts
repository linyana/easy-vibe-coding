import type { API, UseAPIItem } from '@/libs/api';

export type User = UseAPIItem<typeof API.users.get>;

export type UsersAction =
	| { kind: 'create' }
	| { kind: 'detail'; user: User }
	| { kind: 'edit'; user: User }
	| { kind: 'delete'; user: User }
	| { kind: 'deleteBatch'; users: User[] };
