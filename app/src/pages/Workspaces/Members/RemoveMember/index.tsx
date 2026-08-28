import { API } from '@/libs/api';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { WorkspaceMember } from '../../types';

export function RemoveMemberDialog({
	workspaceSlug,
	member,
	open,
	onOpenChange,
}: {
	workspaceSlug: string;
	member: WorkspaceMember;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const mutation = useAPIMutation({
		call: () =>
			API.workspaces({ workspaceSlug })
				.members({ userId: member.userId })
				.delete(),
		queryKey: ['workspaces', workspaceSlug, 'members'],
		successMessage: 'Member removed',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Remove member"
			confirmText={member.email}
			mutation={mutation}
		>
			{`${member.name} (${member.email}) will lose access to this workspace's data. This action cannot be undone.`}
		</RemoveDialog>
	);
}
