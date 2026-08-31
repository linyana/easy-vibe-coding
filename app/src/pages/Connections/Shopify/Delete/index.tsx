import { API } from '@/libs/api';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { Connection } from '../../types';

export function DeleteConnectionDialog({
	connection,
	open,
	onOpenChange,
}: {
	connection: Connection;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const mutation = useAPIMutation({
		call: () => API.connections({ id: connection.id }).delete(),
		queryKey: ['connections', connection.platform],
		successMessage: 'Connection deleted',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Delete connection"
			confirmText={connection.name}
			mutation={mutation}
		>
			{`You are about to permanently delete ${connection.name}. The stored access token will be lost. This action cannot be undone.`}
		</RemoveDialog>
	);
}
