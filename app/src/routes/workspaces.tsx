// The workspace pages' shell — authenticated, and every surface under it
// addresses a workspace by URL slug (the $slug layout below resolves it per
// request). The bare /workspaces path is a redirect hub for legacy links; the
// picker itself lives at /personal/workspaces.
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { SessionProvider, sessionBeforeLoad } from '@/providers';

export const Route = createFileRoute('/workspaces')({
	beforeLoad: sessionBeforeLoad,
	component: WorkspacesShell,
});

function WorkspacesShell() {
	return (
		<SessionProvider>
			<Outlet />
		</SessionProvider>
	);
}
