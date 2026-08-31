import { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { AdminWorkspacesAction } from './types';
import { WorkspaceList } from './List';
import { CreateWorkspaceDialog } from './Create';
import { EditWorkspaceDialog } from './Edit';
import { DeleteWorkspaceDialog } from './Delete';
import { MembersDialog } from './Members';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIMutation } from '@/hooks/useAPIMutation';

export const AdminWorkspaces = () => {
	const [action, setAction] = useState<AdminWorkspacesAction | null>(null);
	const [open, setOpen] = useState(false);
	const { update } = useGlobal();
	const navigate = useNavigate();

	// Enter = exchange for a workspace-scoped token (admin switch, any
	// workspace) then land on the workspace surface. Not a dialog: the row
	// action navigates straight there.
	const enterMutation = useAPIMutation({
		call: (slug: string) => API.workspaces.admin.switch.post({ slug }),
		queryKey: ['auth'],
		// Entering a workspace is a context change, not a write — no toast.
		onSuccess: ({ token, workspace }) => {
			update({ token, workspace });
			void navigate({ to: '/admin/workspace/member' });
		},
	});

	const handleAction = useCallback(
		(action: AdminWorkspacesAction) => {
			if (action.kind === 'enter') {
				enterMutation.mutate(action.workspace.slug);
				return;
			}
			setAction(action);
			setOpen(true);
		},
		[enterMutation],
	);

	const handleOpenChange = useCallback((open: boolean) => setOpen(open), []);

	return (
		<>
			<WorkspaceList onAction={handleAction} />
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
			{action?.kind === 'members' && (
				<MembersDialog
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
