import { Outlet, createFileRoute } from '@tanstack/react-router';
import { LayoutProvider, SessionGate } from '@/providers';
import { requireAuth } from '@/libs/routerGuard';
import { personalNavGroups } from '@/providers/layout/nav';

// The personal shell (pathless layout): the signed-in user's own surface —
// their workspace list (the picker), admin global pages. No workspace
// switcher here; entering a workspace switches to the workspace shell.
export const Route = createFileRoute('/_app')({
	beforeLoad: requireAuth,
	component: () => (
		<SessionGate>
			<LayoutProvider navGroups={personalNavGroups}>
				<Outlet />
			</LayoutProvider>
		</SessionGate>
	),
});
