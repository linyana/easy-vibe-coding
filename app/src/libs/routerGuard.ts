import { redirect } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';

// Shared by the personal shell (_app) and the workspace shell (_workspace):
// every authenticated surface requires a token. This is the sync gate; the
// component-side useSession validation (loading/error/unauthenticated) lives
// in SessionGate.
export function requireAuth({
	location,
}: {
	location: { pathname: string; searchStr: string };
}) {
	// No token → sign-in, remembering where we were heading (login returns
	// there via `redirect`; searchStr is the raw query string).
	if (!useGlobal.getState().auth.token) {
		throw redirect({
			to: '/login',
			search: {
				redirect: location.pathname + location.searchStr,
			},
		});
	}
}
