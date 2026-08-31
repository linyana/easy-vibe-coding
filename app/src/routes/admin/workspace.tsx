// The entered workspace's surface — the fail-closed gate shared by every
// section under /admin/workspace (Member now, Permission later). Component-
// level (not beforeLoad) because the workspace context is restored by /auth/me
// on boot, which resolves inside the admin shell's session gate — a beforeLoad
// check would bounce before the echo lands.
import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';

export const Route = createFileRoute('/admin/workspace')({
	component: WorkspaceShell,
});

function WorkspaceShell() {
	const { workspace } = useGlobal();
	// No entered workspace → back to the picker to choose one first.
	if (!workspace) return <Navigate to="/admin/workspaces" replace />;
	return <Outlet />;
}
