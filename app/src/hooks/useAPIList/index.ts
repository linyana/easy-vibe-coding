import { useCallback, useEffect, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import type { PaginationState, RowSelectionState } from '@tanstack/react-table';
import type { EdenCall } from '@/libs/api';
import type { FormControl } from '@/components';
import { useAPIQuery, type UseAPIQueryOptions } from '@/hooks/useAPIQuery';

export interface APIListSearch {
	page?: number;
	pageSize?: number;
	q?: string;
}

export interface APIListResponse<TItem> {
	items: TItem[];
	total: number;
}

interface UseAPIListOptions<
	TSearch extends APIListSearch,
	TData extends APIListResponse<unknown>,
> extends Omit<UseAPIQueryOptions<TData>, 'queryKey' | 'queryFn'> {
	queryKey: readonly unknown[];
	initialSearch?: Partial<TSearch>;
	call: (opts: { query: TSearch }) => EdenCall<TData>;
	/** Stable row identity for selection — an index fallback would silently re-select shifted rows after a delete. */
	getRowId?: (item: TData['items'][number], index: number) => string;
}

// Merge first, then strip empties: a cleared filter must overwrite the old value
// in state before disappearing, or clearing never propagates.
const dropEmpty = <T extends object>(obj: T): T =>
	Object.fromEntries(
		Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''),
	) as T;

export function useAPIList<
	TSearch extends APIListSearch,
	TData extends APIListResponse<unknown>,
>({
	queryKey,
	initialSearch,
	call,
	getRowId,
	...queryOptions
}: UseAPIListOptions<TSearch, TData>) {
	const [search, setSearchState] = useState<TSearch>(
		(initialSearch ?? {}) as TSearch,
	);

	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const onRowSelectionChange = useCallback(
		(
			updater:
				| RowSelectionState
				| ((old: RowSelectionState) => RowSelectionState),
		) => {
			setRowSelection(updater);
		},
		[],
	);

	const listQuery = useAPIQuery({
		...queryOptions,
		queryKey: [...queryKey, { ...search }],
		queryFn: () => call({ query: search }),
		// keepPreviousData is generic — through the spread its T can't be
		// inferred, so pin it to the list's response type.
		placeholderData: keepPreviousData as (
			previous: TData | undefined,
		) => TData | undefined,
	});

	// Any filter/page change resets selection — batch actions always target the
	// rows on screen, never a cross-page ghost set.
	const updateSearch = useCallback((fn: (prev: TSearch) => TSearch) => {
		setRowSelection({});
		setSearchState(fn);
	}, []);

	const setFilter = useCallback(
		(patch: Partial<TSearch>) => {
			updateSearch(
				(prev) => dropEmpty({ ...prev, ...patch, page: 1 }) as TSearch,
			);
		},
		[updateSearch],
	);

	const setPage = useCallback(
		(patch: Partial<TSearch>) => {
			updateSearch((prev) => dropEmpty({ ...prev, ...patch }) as TSearch);
		},
		[updateSearch],
	);

	const page = search.page ?? 1;
	const pageSize = search.pageSize ?? 10;
	const pagination = useMemo(
		() => ({ pageIndex: page - 1, pageSize }),
		[page, pageSize],
	);
	const onPaginationChange = useCallback(
		(
			updater:
				| PaginationState
				| ((old: PaginationState) => PaginationState),
		) => {
			const next =
				typeof updater === 'function' ? updater(pagination) : updater;
			setPage({
				page: next.pageIndex + 1,
				pageSize: next.pageSize,
			} as Partial<TSearch>);
		},
		[pagination, setPage],
	);

	// Clamp only against a real total: while loading/errored, totalPages
	// degrades to 1 and clamping would yank a legal page jump back to page 1.
	const totalPages = Math.max(
		1,
		Math.ceil((listQuery.data?.total ?? 0) / pageSize),
	);
	useEffect(() => {
		if (listQuery.isLoading || listQuery.isError) return;
		if (page > totalPages)
			setPage({ page: totalPages } as Partial<TSearch>);
	}, [page, totalPages, listQuery.isLoading, listQuery.isError, setPage]);

	const control = useMemo(
		(): FormControl<TSearch> => ({ values: search, set: setFilter }),
		[search, setFilter],
	);

	// Derived from the live data, not the selection keys — a stale key (row
	// deleted server-side) matches nothing and quietly drops out.
	const selectedItems = useMemo(() => {
		if (!getRowId) return [] as TData['items'][number][];
		const items = listQuery.data?.items;
		if (!items) return [] as TData['items'][number][];
		return items.filter(
			(item, index) => rowSelection[getRowId(item, index)] ?? false,
		) as TData['items'][number][];
	}, [getRowId, listQuery.data, rowSelection]);

	const queryError = listQuery.error;

	return {
		search,
		setFilter,
		control,
		setPage,
		listQuery,
		pagination,
		onPaginationChange,
		queryError,
		getRowId,
		rowSelection,
		onRowSelectionChange,
		selectedItems,
	};
}
