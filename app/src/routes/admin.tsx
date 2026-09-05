// The admin shell — platform-level, deliberately OUTSIDE the workspace-scoped
// _app: admins manage accounts/workspaces, not a workspace. Reuses the shared
// session gate + standard app chrome; only the isAdmin gate and the sidebar
// differ. The entered-workspace surface (/admin/workspace/*) swaps in a
// workspace-mode sidebar (the shell picks by path — the surfaces never switch
// modes themselves).
import {
	Outlet,
	createFileRoute,
	useLocation,
	Link,
} from '@tanstack/react-router';
import { ShieldCheckIcon, ArrowLeftIcon } from 'lucide-react';
import { useGlobal } from '@/hooks/useGlobal';
import {
	LayoutProvider,
	SessionProvider,
	sessionBeforeLoad,
} from '@/providers';
import { AdminSidebar } from '@/providers/layout/Sidebar/Admin';
import { AdminWorkspaceSidebar } from '@/providers/layout/Sidebar/AdminWorkspace';
import { Button } from '@/components/ui/button';

const isWorkspacePath = (pathname: string) =>
	pathname === '/admin/workspace' || pathname.startsWith('/admin/workspace/');

export const Route = createFileRoute('/admin')({
	beforeLoad: sessionBeforeLoad,
	component: AdminShell,
});

function AdminShell() {
	const { account } = useGlobal();
	const location = useLocation();

	// SessionProvider only renders children once authenticated, so `account`
	// is loaded here — the branch below is the UI-side isAdmin boundary (the
	// API re-checks the DB row on every request regardless).
	const sidebar = isWorkspacePath(location.pathname) ? (
		<AdminWorkspaceSidebar variant="inset" />
	) : (
		<AdminSidebar variant="inset" />
	);

	return (
		<SessionProvider>
			{!account?.isAdmin ? (
				<div className="flex min-h-dvh items-center justify-center p-4">
					<div className="w-full max-w-md space-y-4 text-center">
						<ShieldCheckIcon className="mx-auto size-10 text-muted-foreground" />
						<h1 className="text-2xl font-semibold">
							Admin access required
						</h1>
						<p className="text-sm text-muted-foreground">
							This section is reserved for platform admins. Your
							account does not have admin access.
						</p>
						<Button asChild variant="outline">
							<Link to="/">
								<ArrowLeftIcon className="size-4" />
								Back to app
							</Link>
						</Button>
					</div>
				</div>
			) : (
				<LayoutProvider sidebar={sidebar}>
					<Outlet />
				</LayoutProvider>
			)}
		</SessionProvider>
	);
}
