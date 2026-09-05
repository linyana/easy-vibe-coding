// The personal shell — context-free (workspace-independent), deliberately
// OUTSIDE the workspace-scoped _app: profile pages (Account, LLM providers)
// and the workspace picker work whether or not a workspace is entered. Same
// shared session gate as _app / admin; only the sidebar differs.
import { Outlet, createFileRoute } from '@tanstack/react-router';
import {
	LayoutProvider,
	SessionProvider,
	sessionBeforeLoad,
} from '@/providers';
import { ProfileSidebar } from '@/providers/layout/Sidebar/Profile';

export const Route = createFileRoute('/profile')({
	beforeLoad: sessionBeforeLoad,
	component: ProfileShell,
});

function ProfileShell() {
	return (
		<SessionProvider>
			<LayoutProvider sidebar={<ProfileSidebar variant="inset" />}>
				<Outlet />
			</LayoutProvider>
		</SessionProvider>
	);
}
