import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// No cache by default: stale on arrival, GC'd when unobserved, every
			// mount refetches — within one mount the query key still dedupes.
			staleTime: 0,
			gcTime: 0,
			refetchOnMount: 'always',
			refetchOnWindowFocus: false,
			// Retry is user-initiated (ErrorState's Retry → refetch), never automatic.
			retry: 0,
		},
		mutations: {
			// Writes must never auto-retry (double-submit risk).
			retry: 0,
		},
	},
});
