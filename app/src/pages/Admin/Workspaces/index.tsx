import { useCallback, useState } from 'react';
import type { AdminWorkspacesAction } from './types';
import { WorkspaceList } from './List';
import { CreateWorkspaceDialog } from './Create';
import { EditWorkspaceDialog } from './Edit';
import { DeleteWorkspaceDialog } from './Delete';
import { MembersDialog } from './Members';

export const AdminWorkspaces = () => {
	const [action, setAction] = useState<AdminWorkspacesAction | null>(null);
	const [open, setOpen] = useState(false);

	const handleAction = useCallback((action: AdminWorkspacesAction) => {
		setAction(action);
		setOpen(true);
	}, []);

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
