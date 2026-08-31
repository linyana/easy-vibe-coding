import { useCallback, useState } from 'react';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { usePageHeader } from '@/hooks';
import type { MemberRole } from '@easy-vibe-coding/shared';
import type { MemberAction } from './types';
import { MemberList } from './List';
import { AddMemberDialog } from './Add';
import { RemoveMemberDialog } from './Remove';

// The member surface's orchestration — which dialog is open and for whom;
// add/remove open dialogs, role change is a direct write (no dialog). The
// fail-closed shell guarantees a workspace context before this mounts.
export const AdminWorkspaceMember = () => {
	const { workspace } = useGlobal();
	const [action, setAction] = useState<MemberAction | null>(null);
	const [open, setOpen] = useState(false);

	// Role change — same one-write vocabulary as the dialogs: the queryKey
	// prefix invalidates the list after success.
	const changeRole = useAPIMutation({
		call: ({ accountId, role }: { accountId: number; role: MemberRole }) =>
			API.workspaces
				.admin({ id: workspace!.id })
				.members({ accountId })
				.patch({ role }),
		queryKey: ['workspaces', 'admin', 'members', workspace?.id],
		successMessage: 'Role updated',
	});

	usePageHeader({ title: workspace?.name ?? 'Workspace' });

	const handleAction = useCallback(
		(action: MemberAction) => {
			if (action.kind === 'role') {
				changeRole.mutate({
					accountId: action.member.id,
					role: action.role,
				});
				return;
			}
			setAction(action);
			setOpen(true);
		},
		[changeRole],
	);

	const handleOpenChange = useCallback((open: boolean) => setOpen(open), []);

	return (
		<>
			<MemberList onAction={handleAction} />
			{action?.kind === 'add' && (
				<AddMemberDialog open={open} onOpenChange={handleOpenChange} />
			)}
			{action?.kind === 'remove' && (
				// key remounts per row — the RemoveDialog's confirm text seeds
				// from the member snapshot (no sync effect).
				<RemoveMemberDialog
					key={action.member.id}
					member={action.member}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</>
	);
};
