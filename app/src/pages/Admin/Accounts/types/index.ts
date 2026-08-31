import type { API, UseAPIItem } from '@/libs/api';

export type Account = UseAPIItem<typeof API.accounts.get>;

export type AdminAccountsAction =
	| { kind: 'create' }
	| { kind: 'edit'; account: Account }
	| { kind: 'toggleAdmin'; account: Account }
	| { kind: 'resetPassword'; account: Account }
	| { kind: 'delete'; account: Account }
	| { kind: 'deleteBatch'; accounts: Account[] };
