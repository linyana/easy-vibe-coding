import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import type { UseAPIError } from '@/libs/error';
import type { AuthStatus } from '@/hooks/useGlobal';

// Session lifecycle for the _app gate: no token → unauthenticated; token
// without user → loading (me fetch); me 200 → authenticated; me 401 is
// already cleared by the global response hook (libs/api), so this hook only
// marks non-401 failures as error. Runs once per boot — the query disables
// as soon as the user is stored.
export function useSession(): {
	status: AuthStatus;
	error: UseAPIError | null;
	refetch: () => void;
} {
	const token = useGlobal((s) => s.auth.token);
	const user = useGlobal((s) => s.auth.user);
	const setSession = useGlobal((s) => s.actions.setSession);
	const setAuthStatus = useGlobal((s) => s.actions.setAuthStatus);

	const query = useAPIQuery({
		queryKey: ['auth', 'me'],
		queryFn: () => API.auth.me.get(),
		enabled: Boolean(token) && !user,
		toastError: false,
		onSuccess: (me) => {
			if (token) setSession(token, me);
		},
		onError: (error) => {
			// A 401 already cleared the session via the global response hook —
			// overriding the status here would show the error state instead of
			// redirecting to login. Any other failure is the retryable error state.
			if (error.code !== 'UNAUTHORIZED') setAuthStatus('error');
		},
	});

	const status: AuthStatus = !token
		? 'unauthenticated'
		: user
			? 'authenticated'
			: query.isError
				? 'error'
				: 'loading';

	return {
		status,
		error: query.error,
		refetch: () => void query.refetch(),
	};
}
