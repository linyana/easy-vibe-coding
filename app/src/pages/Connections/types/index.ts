import type { API, UseAPIItem } from '@/libs/api';

export type Connection = UseAPIItem<typeof API.connections.get>;

export type ConnectionsAction =
	| { kind: 'create' }
	| { kind: 'edit'; connection: Connection }
	| { kind: 'delete'; connection: Connection };
