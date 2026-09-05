import type { ReactNode } from 'react';
import { Navigate, redirect } from '@tanstack/react-router';
import type { ParsedLocation } from '@tanstack/react-router';
import { setCurrentWorkspaceSlug } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useSession } from '@/hooks/useSession';
import { ErrorState } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';

// The authenticated shells' pre-route token check — no token → sign-in,
// remembering where the user was heading (login returns there via
// `redirect`; searchStr is the raw query string). Shared by every
// authenticated surface (workspaces / admin / personal). Also drops the
// request-scope workspace slug (libs/api) — a slug layout's own beforeLoad
// re-sets it right after (ancestors run first, so the leaf wins).
export function sessionBeforeLoad({ location }: { location: ParsedLocation }) {
	setCurrentWorkspaceSlug(null);
	if (!useGlobal.getState().token) {
		throw redirect({
			to: '/login',
			search: {
				redirect: location.pathname + location.searchStr,
			},
		});
	}
}

// The shell-level session gate, shared by every authenticated surface: the
// token-less 401/redirect, loading, and non-401 error states all render here,
// so a shell only composes its own content — an invalid token never flashes
// the app chrome. Children render only when the session is authenticated.
export function SessionProvider({ children }: { children: ReactNode }) {
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

	return <>{children}</>;
}
