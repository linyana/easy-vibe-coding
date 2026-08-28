import { Outlet, createFileRoute } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';
import { LayoutProvider, SessionGate } from '@/providers';
import { WorkspaceSwitcher } from '@/providers/layout/Header/WorkspaceSwitcher';
import { requireAuth } from '@/libs/routerGuard';
import { workspaceNavGroups } from '@/providers/layout/nav';

// The workspace shell (pathless layout): everything inside one workspace —
// its dashboard, members, and future business modules. Only reachable through
// a workspace route ($workspaceSlug layout enforces a selected workspace); the
// app bar carries the workspace switcher, the sidebar is workspace-scoped.
export const Route = createFileRoute('/_workspace')({
	beforeLoad: requireAuth,
	component: WorkspaceShell,
});

function WorkspaceShell() {
	const currentWorkspaceId = useGlobal((s) => s.currentWorkspaceId);

	return (
		<SessionGate>
			<LayoutProvider
				navGroups={workspaceNavGroups(currentWorkspaceId)}
				headerRight={<WorkspaceSwitcher />}
			>
				<Outlet />
			</LayoutProvider>
		</SessionGate>
	);
}
