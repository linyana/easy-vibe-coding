import { API } from '@/libs/api';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { Account } from '../types';

// Batch delete — count-based type-to-confirm (no single name to type: the user
// types the NUMBER of rows). The dialog gets a SNAPSHOT of the selection, so
// the mutation's target can't drift while it is open; after success the deleted
// rows drop out of the live data and the selection clears itself — no explicit
// clear call.
export function DeleteAccountsDialog({
	accounts,
	open,
	onOpenChange,
}: {
	accounts: Account[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const count = accounts.length;
	const mutation = useAPIMutation({
		call: () =>
			API.accounts['batch-delete'].post({
				ids: accounts.map((account) => account.id),
			}),
		queryKey: ['accounts'],
		successMessage:
			count === 1 ? 'Account deleted' : `${count} accounts deleted`,
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title={`Delete ${count} ${count === 1 ? 'account' : 'accounts'}`}
			confirmText={String(count)}
			mutation={mutation}
		>
			{`You are about to permanently delete ${count} ${
				count === 1 ? 'account' : 'accounts'
			}. This action cannot be undone.`}
		</RemoveDialog>
	);
}
