import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';

// Layout for everything under one workspace. beforeLoad enforces the rule
// every workspace-scoped page shares: a selected workspace is required
// (currentWorkspaceId). Entry points (list row, header switcher, create) set
// it before navigating; a direct URL with no selection bounces to the picker.
// Arriving by URL also re-syncs the current workspace to the one being viewed.
export const Route = createFileRoute('/_workspace/workspaces/$workspaceSlug')({
	beforeLoad: ({ params }) => {
		const current = useGlobal.getState().currentWorkspaceId;
		if (current === null) {
			throw redirect({ to: '/workspaces' });
		}
		if (params.workspaceSlug && params.workspaceSlug !== current) {
			useGlobal
				.getState()
				.actions.setCurrentWorkspaceId(params.workspaceSlug);
		}
	},
	component: () => <Outlet />,
});
