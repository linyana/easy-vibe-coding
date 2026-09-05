import { useCallback, useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import type { AdminWorkspacesAction } from './types';
import { WorkspaceList } from './List';
import { CreateWorkspaceDialog } from './Create';
import { EditWorkspaceDialog } from './Edit';
import { DeleteWorkspaceDialog } from './Delete';
import { API } from '@/libs/api';
import { useAPIMutation } from '@/hooks/useAPIMutation';

export const AdminWorkspaces = () => {
	const [action, setAction] = useState<AdminWorkspacesAction | null>(null);
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const router = useRouter();

	// Enter = open the workspace's admin slug pages in a NEW TAB (URL-addressed
	// — admins can enter any workspace; the admin guard re-validates per
	// request). The list stays open so the admin can enter several. If the
	// browser blocks the popup, fall back to navigating this tab.
	const enter = (slug: string) => {
		const href = router.buildLocation({
			to: '/admin/workspaces/$slug/member',
			params: { slug },
		}).href;
		const opened = window.open(href, '_blank');
		if (opened) {
			opened.opener = null;
			return;
		}
		void navigate({
			to: '/admin/workspaces/$slug/member',
			params: { slug },
		});
	};

	// Disable/enable (soft delete) — same non-dialog shape as enter: the
	// switch flips, the list refetches, and the gates on the API side enforce
	// the new state.
	const toggleMutation = useAPIMutation({
		call: ({ id, enable }: { id: number; enable: boolean }) =>
			enable
				? API.workspaces.admin({ id }).enable.post()
				: API.workspaces.admin({ id }).disable.post(),
		queryKey: ['workspaces', 'admin'],
		// Directional feedback — which way the flag flipped is the signal.
		onSuccess: (_, { enable }) =>
			toast.success(enable ? 'Workspace enabled' : 'Workspace disabled'),
	});

	const handleAction = useCallback(
		(action: AdminWorkspacesAction) => {
			if (action.kind === 'enter') {
				enter(action.workspace.slug);
				return;
			}
			if (action.kind === 'toggle') {
				toggleMutation.mutate({
					id: action.workspace.id,
					enable: action.enable,
				});
				return;
			}
			setAction(action);
			setOpen(true);
		},
		[toggleMutation, enter],
	);

	const handleOpenChange = useCallback((open: boolean) => setOpen(open), []);

	return (
		<>
			<WorkspaceList
				onAction={handleAction}
				togglePending={toggleMutation.isPending}
			/>
			{action?.kind === 'create' && (
				<CreateWorkspaceDialog
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'edit' && (
				// key remounts per row — initialValues are a snapshot, so the
				// form re-seeds from the new row (no sync effect).
				<EditWorkspaceDialog
					key={action.workspace.id}
					workspace={action.workspace}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'delete' && (
				<DeleteWorkspaceDialog
					key={action.workspace.id}
					workspace={action.workspace}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</>
	);
};
