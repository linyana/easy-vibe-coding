import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { callEden, type EdenCall } from '@/libs/api';
import type { UseAPIError } from '@/libs/error';

export interface UseAPIQueryOptions<TData> {
	queryKey: readonly unknown[];
	queryFn: () => EdenCall<TData>;
	enabled?: boolean;
	staleTime?: number;
	gcTime?: number;
	placeholderData?:
		| TData
		| ((previousData: TData | undefined) => TData | undefined);
	retry?: number | boolean;
	toastError?: boolean;
	/** Called once per settled failure, deduped per error object — an inline closure changing identity each render can't double-fire. */
	onError?: (error: UseAPIError) => void;
	/** Called once per settled success, deduped per data reference — a refetch resolving structurally-identical data still notifies. */
	onSuccess?: (data: TData) => void;
}

export function useAPIQuery<TData>({
	queryFn,
	toastError = true,
	onError,
	onSuccess,
	...options
}: UseAPIQueryOptions<TData>) {
	const query = useQuery<TData, UseAPIError>({
		...options,
		queryFn: () => callEden(queryFn()),
		// TanStack wraps placeholderData in NonFunctionGuard<T> — never satisfiable
		// for a generic TData (known v5 typing limitation). The value is always a
		// passthrough, so pin it as never at the boundary.
		placeholderData: options.placeholderData as never,
	});
	// keepPreviousData widens the observer's data type to `TData & ({} | null)`;
	// pin it back for consumers.
	const data = query.data as TData | undefined;
	const error: UseAPIError | null =
		query.isError && !data ? query.error : null;

	// Notify once per SETTLED failure (after retries run out): the ref dedupes
	// by error object and resets when a new fetch starts. Toast first — the
	// built-in channel keeps priority if the feature callback throws.
	const notifiedErrorRef = useRef<UseAPIError | null>(null);
	useEffect(() => {
		if (query.isFetching) {
			notifiedErrorRef.current = null;
			return;
		}
		if (!query.isError || !query.error) return;
		if (notifiedErrorRef.current === query.error) return;
		notifiedErrorRef.current = query.error;
		if (toastError) toast.error(query.error.message);
		onError?.(query.error);
	}, [toastError, onError, query.isError, query.isFetching, query.error]);

	// Notify once per settled success: the ref dedupes by data reference and
	// resets when a new fetch starts — a refetch resolving structurally-identical
	// data (structural sharing keeps the old reference) still notifies.
	const notifiedDataRef = useRef<TData | null>(null);
	useEffect(() => {
		if (query.isFetching) {
			notifiedDataRef.current = null;
			return;
		}
		if (query.isSuccess && data !== undefined) {
			if (notifiedDataRef.current === data) return;
			notifiedDataRef.current = data;
			onSuccess?.(data);
		}
	}, [onSuccess, query.isSuccess, query.isFetching, data]);

	return { ...query, data, error };
}
