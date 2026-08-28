import { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { WorkspacesAction } from './types';
import { useGlobal } from '@/hooks/useGlobal';
import { WorkspaceList } from './List';
import { CreateWorkspaceDialog } from './Create';
import { RenameWorkspaceDialog } from './Edit';

export { WorkspacesDashboard } from './Dashboard';
export { WorkspacesMembers } from './Members';

export const Workspaces = () => {
	const navigate = useNavigate();
	const [action, setAction] = useState<WorkspacesAction | null>(null);
	const [open, setOpen] = useState(false);

	const handleAction = useCallback(
		(action: WorkspacesAction) => {
			// Detail is a navigation, not a dialog — /workspaces/$workspaceSlug
			// is the single workspace surface (also linked from the name
			// column). Entering a workspace's pages requires a selected
			// workspace (the $workspaceSlug layout redirects to /workspaces
			// when currentWorkspaceId is null) — set it here so the row click
			// doesn't bounce.
			if (action.kind === 'detail') {
				useGlobal
					.getState()
					.actions.setCurrentWorkspaceId(action.workspace.slug);
				void navigate({
					to: '/workspaces/$workspaceSlug',
					params: { workspaceSlug: action.workspace.slug },
				});
				return;
			}
			setAction(action);
			setOpen(true);
		},
		[navigate],
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
			{action?.kind === 'rename' && (
				// key remounts per row — initialValues are a snapshot, so the
				// form re-seeds from the new row.
				<RenameWorkspaceDialog
					key={action.workspace.slug}
					workspace={action.workspace}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</>
	);
};
