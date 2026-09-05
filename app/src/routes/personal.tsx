// The personal shell — context-free (workspace-independent), deliberately
// OUTSIDE the workspace-scoped _app: personal pages (Account, LLM providers)
// and the workspace picker work whether or not a workspace is entered. Same
// shared session gate as _app / admin; only the sidebar differs.
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { SessionProvider, sessionBeforeLoad } from '@/providers';
import { LayoutProvider } from '@/components/layout/LayoutProvider';
import { PersonalSidebar } from '@/components/layout/PersonalSidebar';

export const Route = createFileRoute('/personal')({
	beforeLoad: sessionBeforeLoad,
	component: PersonalShell,
});

function PersonalShell() {
	return (
		<SessionProvider>
			<LayoutProvider sidebar={<PersonalSidebar variant="inset" />}>
				<Outlet />
			</LayoutProvider>
		</SessionProvider>
	);
}
