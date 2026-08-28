import { Navigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useSession } from '@/hooks/useSession';
import { ErrorState } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';

// The session validation gate every shell shares: loading → spinner, 401 →
// sign-in (carrying the destination), other errors → inline retry. The shell
// only renders once the session is known-good.
export function SessionGate({ children }: { children: ReactNode }) {
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

	return children;
}
