// The authenticated workspace app (pathless layout). The shared session gate
// (SessionProvider) handles token-less/loading/error; WorkspaceProvider then
// re-scopes the context — no workspace → the profile shell's picker, so an
// entered workspace never renders without context.
import { Outlet, createFileRoute } from '@tanstack/react-router';
import {
	LayoutProvider,
	SessionProvider,
	WorkspaceProvider,
	sessionBeforeLoad,
} from '@/providers';

export const Route = createFileRoute('/_app')({
	beforeLoad: sessionBeforeLoad,
	component: AppShell,
});

function AppShell() {
	return (
		<SessionProvider>
			<WorkspaceProvider>
				<LayoutProvider>
					<Outlet />
				</LayoutProvider>
			</WorkspaceProvider>
		</SessionProvider>
	);
}
