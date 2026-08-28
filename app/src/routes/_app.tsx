// The authenticated app shell (pathless layout): beforeLoad is the sync token
// guard; the component gate (useSession) validates against the API and renders
// loading/error before the shell appears — an invalid token never flashes the app.
import {
	Navigate,
	Outlet,
	createFileRoute,
	redirect,
} from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';
import { useSession } from '@/hooks/useSession';
import { LayoutProvider } from '@/providers';
import { ErrorState } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';

export const Route = createFileRoute('/_app')({
	beforeLoad: ({ location }) => {
		// No token → sign-in, remembering where we were heading (login returns
		// there via `redirect`; searchStr is the raw query string).
		if (!useGlobal.getState().token) {
			throw redirect({
				to: '/login',
				search: {
					redirect: location.pathname + location.searchStr,
				},
			});
		}
	},
	component: AppShell,
});

function AppShell() {
	const { status, error, refetch } = useSession();

	if (status === 'unauthenticated') {
		// The session dropped mid-app (a 401 cleared the token) — back to
		// sign-in, carrying the destination.
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
		// Session check failed without a 401 (network drop, 5xx) — shared retry.
		return (
			<div className="flex min-h-dvh items-center justify-center p-4">
				<div className="w-full max-w-md">
					<ErrorState error={error} onRetry={refetch} />
				</div>
			</div>
		);
	}

	return (
		<LayoutProvider>
			<Outlet />
		</LayoutProvider>
	);
}
