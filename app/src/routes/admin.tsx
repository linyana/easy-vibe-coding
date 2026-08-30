// The admin shell — platform-level, deliberately OUTSIDE the workspace-scoped
// _app: admins manage accounts/workspaces, not a workspace. It reuses the
// standard app chrome (LayoutProvider + sidebar + SiteHeader); only the
// sidebar contents and the gate differ. beforeLoad is the sync token guard;
// the component gate re-validates the session AND the isAdmin flag against
// /auth/me before the shell appears.
import {
	Navigate,
	Outlet,
	createFileRoute,
	redirect,
} from '@tanstack/react-router';
import { ShieldCheckIcon, ArrowLeftIcon } from 'lucide-react';
import { useGlobal } from '@/hooks/useGlobal';
import { useSession } from '@/hooks/useSession';
import { ErrorState } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import { LayoutProvider } from '@/providers';
import { AdminSidebar } from '@/providers/layout/Sidebar/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
	beforeLoad: ({ location }) => {
		if (!useGlobal.getState().token) {
			throw redirect({
				to: '/login',
				search: {
					redirect: location.pathname + location.searchStr,
				},
			});
		}
	},
	component: AdminShell,
});

function AdminShell() {
	const { status, error, refetch } = useSession();
	const { account } = useGlobal();

	if (status === 'unauthenticated') {
		return (
			<Navigate
				to="/login"
				search={{
					redirect: window.location.pathname + window.location.search,
				}}
			/>
		);
	}

	if (status === 'loading') {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<DotsRingLoading size={40} />
			</div>
		);
	}

	if (status === 'error' && error) {
		return (
			<div className="flex min-h-dvh items-center justify-center p-4">
				<div className="w-full max-w-md">
					<ErrorState error={error} onRetry={refetch} />
				</div>
			</div>
		);
	}

	// Authenticated but not an admin — the admin surface is gated server-side
	// too (adminGuard), this is just the UI-side boundary.
	if (!account?.isAdmin) {
		return (
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
		);
	}

	return (
		<LayoutProvider sidebar={<AdminSidebar variant="inset" />}>
			<Outlet />
		</LayoutProvider>
	);
}
