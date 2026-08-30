import type { API, UseAPIItem } from '@/libs/api';

export type Account = UseAPIItem<typeof API.accounts.get>;

export type AccountsAction =
	| { kind: 'create' }
	| { kind: 'detail'; account: Account }
	| { kind: 'edit'; account: Account }
	| { kind: 'delete'; account: Account }
	| { kind: 'deleteBatch'; accounts: Account[] };
