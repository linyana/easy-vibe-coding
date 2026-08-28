import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import type { UseAPIError } from '@/libs/error';

export type AuthStatus =
	| 'loading' // token present, current user not fetched yet (boot)
	| 'authenticated'
	| 'unauthenticated'
	| 'error'; // me fetch failed non-401 (network/5xx) — retry is user-initiated

// Session lifecycle for the _app gate: no token → unauthenticated; token
// without user → loading (me fetch); me 200 → authenticated; me 401 is
// already cleared by the global response hook (libs/api), so the derived
// status drops to unauthenticated instead of showing the error state. Runs
// once per boot — the query disables as soon as the user is stored.
export function useSession(): {
	status: AuthStatus;
	error: UseAPIError | null;
	refetch: () => void;
} {
	const { token, user, update } = useGlobal();

	const query = useAPIQuery({
		queryKey: ['auth', 'me'],
		queryFn: () => API.auth.me.get(),
		enabled: Boolean(token) && !user,
		toastError: false,
		onSuccess: (me) => {
			if (token) update({ token, user: me });
		},
	});

	// Status is fully derived — nothing to store: a 401 clears token/user via
	// the global response hook; any other failure surfaces through query.isError.
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
