import { API } from '@/libs/api';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { Workspace } from '../types';

export function DeleteWorkspaceDialog({
	workspace,
	open,
	onOpenChange,
}: {
	workspace: Workspace;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const mutation = useAPIMutation({
		call: () => API.workspaces.admin({ id: workspace.id }).delete(),
		queryKey: ['workspaces', 'admin'],
		successMessage: 'Workspace deleted',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Delete workspace"
			confirmText={workspace.slug}
			mutation={mutation}
		>
			{`You are about to permanently delete ${workspace.name} (${workspace.slug}). All of its memberships are removed with it. This action cannot be undone.`}
		</RemoveDialog>
	);
}
