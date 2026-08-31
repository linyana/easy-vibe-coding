import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { Member } from '../types';

// Remove a member from the entered workspace — type-to-confirm with the
// member's name. The workspace must keep at least one owner: removing the last
// owner comes back as a 409 (default mutation toast).
export function RemoveMemberDialog({
	member,
	open,
	onOpenChange,
}: {
	member: Member;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { workspace } = useGlobal();

	const mutation = useAPIMutation({
		call: () =>
			API.workspaces
				.admin({ id: workspace!.id })
				.members({ accountId: member.id })
				.delete(),
		queryKey: ['workspaces', 'admin', 'members', workspace?.id],
		successMessage: 'Member removed',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Remove member"
			confirmText={member.name}
			mutation={mutation}
		>
			{`You are about to remove ${member.name} (${member.email}) from this workspace. This cannot be undone.`}
		</RemoveDialog>
	);
}
