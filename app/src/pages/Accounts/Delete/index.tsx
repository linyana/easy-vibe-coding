import { API } from '@/libs/api';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { Account } from '../types';

export function DeleteAccountDialog({
	account,
	open,
	onOpenChange,
}: {
	account: Account;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const mutation = useAPIMutation({
		call: () => API.accounts({ id: account.id }).delete(),
		queryKey: ['accounts'],
		successMessage: 'Account deleted',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Delete account"
			confirmText={account.name}
			mutation={mutation}
		>
			{`You are about to permanently delete ${account.name} (${account.email}). This action cannot be undone.`}
		</RemoveDialog>
	);
}
