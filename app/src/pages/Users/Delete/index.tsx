import { API } from '@/libs/api';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { User } from '../types';

export function DeleteUserDialog({
	user,
	open,
	onOpenChange,
}: {
	user: User;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const mutation = useAPIMutation({
		call: () => API.users({ id: user.id }).delete(),
		queryKey: ['users'],
		successMessage: 'User deleted',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Delete user"
			confirmText={user.name}
			mutation={mutation}
		>
			{`You are about to permanently delete ${user.name} (${user.email}). This action cannot be undone.`}
		</RemoveDialog>
	);
}
