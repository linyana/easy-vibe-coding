import { useEffect, useMemo, useRef, useState } from 'react';
import {
	columnPinningFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	tableFeatures,
	useTable,
	type ColumnDef,
	type ColumnPinningState,
	type PaginationState,
	type RowData,
	type RowSelectionState,
} from '@tanstack/react-table';
import type { UseAPIError } from '@/libs/error';
import type { APIListResponse } from '@/hooks/useAPIList';
import { getIcon } from '@/libs/icons';
import type { RowAction } from '@/components/list/Actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loading } from '@/components/loading';
import { cn } from '@/libs/utils';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { ErrorState } from '@/components/data';
import { Pagination } from '@/components/pagination';

import './extensions';

export const features = tableFeatures({
	rowPaginationFeature,
	rowSelectionFeature,
	columnPinningFeature,
});

type PaginationUpdater =
	| PaginationState
	| ((old: PaginationState) => PaginationState);

interface ListTableProps<TData extends RowData> {
	/**
	 * The useAPIList result — a structural slice of what the table consumes
	 * (the actual query result is a discriminated union, not assignable to
	 * UseQueryResult).
	 */
	list: {
		listQuery: {
			data: APIListResponse<TData> | undefined;
			isFetching: boolean;
			refetch: () => Promise<unknown>;
		};
		pagination: PaginationState;
		onPaginationChange: (updater: PaginationUpdater) => void;
		queryError: UseAPIError | null;
		getRowId?: (item: TData, index: number) => string;
		rowSelection?: RowSelectionState;
		onRowSelectionChange?: (
			updater:
				| RowSelectionState
				| ((old: RowSelectionState) => RowSelectionState),
		) => void;
		selectedItems?: TData[];
	};
	columns: ColumnDef<typeof features, TData, unknown>[];
	emptyMessage?: string;
	selection?: {
		actions: (selected: TData[]) => RowAction[];
	};
}

// Stable fallback — a fresh `[]` per render would invalidate the table's row
// model on every render (TanStack Table v9 guidance).
const EMPTY_ITEMS: never[] = [];

export function ListTable<TData extends RowData>({
	list,
	columns,
	emptyMessage = 'No results',
	selection,
}: ListTableProps<TData>) {
	const {
		listQuery,
		pagination,
		onPaginationChange,
		queryError,
		getRowId,
		rowSelection,
		onRowSelectionChange,
		selectedItems,
	} = list;

	const selectColumn: ColumnDef<typeof features, TData> = {
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected()
						? true
						: table.getIsSomePageRowsSelected()
							? 'indeterminate'
							: false
				}
				// Radix passes the boolean VALUE, not a DOM event — the v9
				// getToggle*Handlers would throw on it.
				onCheckedChange={(checked) =>
					table.toggleAllPageRowsSelected(checked === true)
				}
				aria-label="Select all rows on this page"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				disabled={!row.getCanSelect()}
				onCheckedChange={(checked) =>
					row.toggleSelected(checked === true)
				}
				aria-label="Select row"
			/>
		),
	};

	// Translate `meta.fixed` declarations into the library's pinning state
	// (LTR: start = left, end = right).
	const columnPinning = useMemo<ColumnPinningState>(() => {
		const start: string[] = [];
		const end: string[] = [];
		for (const column of columns) {
			if (column.meta?.fixed === 'left' && column.id)
				start.push(column.id);
			if (column.meta?.fixed === 'right' && column.id)
				end.push(column.id);
		}
		return { start, end };
	}, [columns]);

	// antd-style pinned shadow — scrollWidth-based (static, never toggles
	// while scrolling). Observe both container and table: the former for
	// viewport-driven, the latter for content-driven width changes.
	const containerRef = useRef<HTMLDivElement>(null);
	const tableRef = useRef<HTMLTableElement>(null);
	const [hasScroll, setHasScroll] = useState(false);
	// Hover is tracked at the ROW level, applied per-CELL — so the pinned
	// column stays in sync even when the pointer is over another cell.
	const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
	const hasPinnedColumns = columns.some((column) => column.meta?.fixed);
	useEffect(() => {
		const container = containerRef.current;
		const table = tableRef.current;
		if (!container || !table || !hasPinnedColumns) return;
		const update = () =>
			setHasScroll(container.scrollWidth > container.clientWidth + 1);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(container);
		observer.observe(table);
		return () => observer.disconnect();
	}, [hasPinnedColumns]);

	const table = useTable({
		features,
		columns: selection ? [selectColumn, ...columns] : columns,
		data: listQuery.data?.items ?? EMPTY_ITEMS,
		rowCount: listQuery.data?.total,
		getRowId: selection && getRowId ? getRowId : undefined,
		manualPagination: true,
		state: selection
			? { pagination, rowSelection: rowSelection ?? {}, columnPinning }
			: { pagination, columnPinning },
		onPaginationChange,
		onRowSelectionChange,
	});

	if (queryError) {
		return (
			<ErrorState
				error={queryError}
				onRetry={() => listQuery.refetch()}
			/>
		);
	}

	const total = listQuery.data?.total ?? 0;
	const start =
		total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
	const end = Math.min(
		(pagination.pageIndex + 1) * pagination.pageSize,
		total,
	);

	return (
		<div className="space-y-4">
			{/* Toolbar while rows are selected: count (rows on screen — selection
				resets on any page/filter change) + the feature's actions. */}
			{selection && selectedItems && selectedItems.length > 0 && (
				<div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
					<p className="text-sm font-medium">
						{selectedItems.length} selected
					</p>
					<div className="flex items-center gap-2">
						{selection.actions(selectedItems).map((action) => {
							const Icon = getIcon(action.icon.name);
							return (
								<Button
									key={action.label}
									variant={
										action.icon.style === 'destructive'
											? 'destructive'
											: 'outline'
									}
									size="sm"
									onClick={action.onClick}
								>
									{Icon && <Icon className="size-4" />}
									{action.label}
								</Button>
							);
						})}
					</div>
				</div>
			)}

			{/* Loading mask over table AND footer: stale rows stay visible under
				the mask while fetching (first load: mask + spinner alone). */}
			<Loading loading={listQuery.isFetching} needMask maskInset={2}>
				<div className="space-y-4">
					<div className="rounded-lg border">
						<Table ref={tableRef} containerRef={containerRef}>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead
												key={header.id}
												className={cn(
													header.column.getIsPinned() ===
														'start' &&
														cn(
															'sticky left-0 z-10 bg-background',
															hasScroll &&
																'shadow-[inset_-10px_0_8px_-8px_var(--border)]',
														),
													header.column.getIsPinned() ===
														'end' &&
														cn(
															'sticky right-0 z-10 bg-background',
															hasScroll &&
																'shadow-[inset_10px_0_8px_-8px_var(--border)]',
														),
													header.column.columnDef.meta
														?.align === 'center' &&
														'text-center',
													header.column.columnDef.meta
														?.align === 'right' &&
														'text-right',
												)}
											>
												{header.isPlaceholder ? null : (
													<table.FlexRender
														header={header}
													/>
												)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows.length === 0 ? (
									listQuery.data ? (
										<TableRow>
											<TableCell
												colSpan={
													table.getAllLeafColumns()
														.length
												}
												className="h-24 text-center text-muted-foreground"
											>
												{emptyMessage}
											</TableCell>
										</TableRow>
									) : (
										<TableRow>
											<TableCell
												colSpan={
													table.getAllLeafColumns()
														.length
												}
												className="h-80"
											/>
										</TableRow>
									)
								) : (
									table.getRowModel().rows.map((row) => {
										const isActive =
											hoveredRowId === row.id ||
											row.getIsSelected();
										return (
											<TableRow
												key={row.id}
												onMouseEnter={() =>
													setHoveredRowId(row.id)
												}
												onMouseLeave={() =>
													setHoveredRowId(null)
												}
											>
												{row
													.getAllCells()
													.map((cell) => {
														// The pinned cell's sticky background must stay OPAQUE
														// (it masks scrolled rows), so it switches between
														// bg-background and the SAME bg-row-active tint.
														const pinned =
															cell.column.getIsPinned();
														return (
															<TableCell
																key={cell.id}
																className={cn(
																	pinned ===
																		'start' &&
																		cn(
																			isActive
																				? 'sticky left-0 z-10 bg-row-active'
																				: 'sticky left-0 z-10 bg-background',
																			hasScroll &&
																				'shadow-[inset_-10px_0_8px_-8px_var(--border)]',
																		),
																	pinned ===
																		'end' &&
																		cn(
																			isActive
																				? 'sticky right-0 z-10 bg-row-active'
																				: 'sticky right-0 z-10 bg-background',
																			hasScroll &&
																				'shadow-[inset_10px_0_8px_-8px_var(--border)]',
																		),
																	!pinned &&
																		isActive &&
																		'bg-row-active',
																	cell.column
																		.columnDef
																		.meta
																		?.align ===
																		'center' &&
																		'text-center',
																	cell.column
																		.columnDef
																		.meta
																		?.align ===
																		'right' &&
																		'text-right',
																)}
															>
																<table.FlexRender
																	cell={cell}
																/>
															</TableCell>
														);
													})}
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>

					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							{/* Only ever read once the fetch settled — the mask covers
								this whole area while a fetch is in flight. */}
							Showing {start} - {end} of {total}
						</p>
						{/* ALWAYS visible — hiding on a single page would also hide the
					size Select + jumper, leaving no way back after switching to a
					size that fits one page. The 0-based pageIndex conversion for
					TanStack happens here. */}
						<Pagination
							total={total}
							page={pagination.pageIndex + 1}
							pageSize={pagination.pageSize}
							onChange={(page, pageSize) =>
								onPaginationChange({
									pageIndex: page - 1,
									pageSize,
								})
							}
							showSizeChanger
							showQuickJumper
						/>
					</div>
				</div>
			</Loading>
		</div>
	);
}
