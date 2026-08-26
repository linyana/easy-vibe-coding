import { API } from '@/libs/api';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { User } from '../types';

// Batch delete — count-based type-to-confirm (no single name to type: the user
// types the NUMBER of rows). The dialog gets a SNAPSHOT of the selection, so
// the mutation's target can't drift while it is open; after success the deleted
// rows drop out of the live data and the selection clears itself — no explicit
// clear call.
export function DeleteUsersDialog({
	users,
	open,
	onOpenChange,
}: {
	users: User[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const count = users.length;
	const mutation = useAPIMutation({
		call: () =>
			API.users['batch-delete'].post({
				ids: users.map((user) => user.id),
			}),
		queryKey: ['users'],
		successMessage: count === 1 ? 'User deleted' : `${count} users deleted`,
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title={`Delete ${count} ${count === 1 ? 'user' : 'users'}`}
			confirmText={String(count)}
			mutation={mutation}
		>
			{`You are about to permanently delete ${count} ${
				count === 1 ? 'user' : 'users'
			}. This action cannot be undone.`}
		</RemoveDialog>
	);
}
