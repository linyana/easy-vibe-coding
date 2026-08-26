import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

// antd's Pagination as the API reference, executed with the project's own
// conventions: fully CONTROLLED (the hook owns the state, this reports intent
// via onChange), 1-based `page` (wire format — TanStack pageIndex conversion
// happens in ListTable), sibling window with clickable ellipses that jump 5
// pages (a gap marker is a shortcut, not a separator).
//
// Boundary conditions, decided here so features never re-derive them:
//  • `page` is clamped for DISPLAY only — rendering never calls onChange
//    (the list hook owns clamping its state; this must not fight it with an
//    update loop).
//  • total = 0 renders one disabled page; hideOnSinglePage drops the whole
//    control including the size Select (list footers keep it visible).
//  • changing the page size jumps to page 1 — matches useAPIList's setFilter
//    (a filter change also resets to 1).
//  • the quick-jumper input commits on Enter (clamped) and clears on blur.

export interface PaginationProps {
	total: number;
	/** Current page, 1-based (the wire format). */
	page: number;
	pageSize: number;
	/** Fired with the 1-based page (and pageSize) the user navigated to. */
	onChange: (page: number, pageSize: number) => void;
	showSizeChanger?: boolean;
	/** Size options; the current pageSize is appended if missing. */
	pageSizeOptions?: number[];
	showQuickJumper?: boolean;
	showTotal?:
		| boolean
		| ((total: number, range: [number, number]) => ReactNode);
	/**
	 * Hide the WHOLE control on a single page — including the size Select,
	 * so a single page leaves no way back to a smaller size.
	 */
	hideOnSinglePage?: boolean;
	disabled?: boolean;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];
const ELLIPSIS_JUMP = 5;

type PageItem = number | 'ellipsis-left' | 'ellipsis-right';

function buildPages(page: number, totalPages: number): PageItem[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}
	const items: PageItem[] = [1];
	const start = Math.max(2, page - 1);
	const end = Math.min(totalPages - 1, page + 1);
	if (start > 2) items.push('ellipsis-left');
	for (let p = start; p <= end; p++) items.push(p);
	if (end < totalPages - 1) items.push('ellipsis-right');
	items.push(totalPages);
	return items;
}

export function Pagination({
	total,
	page,
	pageSize,
	onChange,
	showSizeChanger = false,
	pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
	showQuickJumper = false,
	showTotal = false,
	hideOnSinglePage = false,
	disabled = false,
}: PaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const current = Math.min(Math.max(page, 1), totalPages);

	if (hideOnSinglePage && totalPages <= 1) return null;

	const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
	const end = Math.min(current * pageSize, total);

	// The one place a navigation intent becomes an onChange: clamp the target
	// into range and skip no-ops (nothing fires when the page didn't change).
	const jump = (target: number) => {
		const clamped = Math.min(Math.max(target, 1), totalPages);
		if (clamped !== current) onChange(clamped, pageSize);
	};

	// A controlled list may page by a size it doesn't offer — include it so
	// the Select still renders the real value.
	const options = pageSizeOptions.includes(pageSize)
		? pageSizeOptions
		: [...pageSizeOptions, pageSize].sort((a, b) => a - b);

	return (
		<nav aria-label="Pagination" className="flex items-center gap-1">
			{showTotal && (
				<p className="pr-2 text-sm text-muted-foreground">
					{typeof showTotal === 'function'
						? showTotal(total, [start, end])
						: `Showing ${start} - ${end} of ${total}`}
				</p>
			)}

			<Button
				variant="outline"
				size="icon"
				disabled={disabled || current <= 1}
				onClick={() => jump(current - 1)}
				aria-label="Previous page"
			>
				<ChevronLeftIcon />
			</Button>

			{buildPages(current, totalPages).map((item) => {
				if (item === 'ellipsis-left') {
					return (
						// The gap marker is a clickable shortcut (jumps 5 pages) —
						// surface that intent with a tooltip, never a blind box.
						<Button
							key={item}
							variant="outline"
							size="icon"
							tooltip={`Jump back ${ELLIPSIS_JUMP} pages`}
							disabled={disabled}
							onClick={() => jump(current - ELLIPSIS_JUMP)}
							aria-label={`Jump back ${ELLIPSIS_JUMP} pages`}
						>
							…
						</Button>
					);
				}
				if (item === 'ellipsis-right') {
					return (
						<Button
							key={item}
							variant="outline"
							size="icon"
							tooltip={`Jump forward ${ELLIPSIS_JUMP} pages`}
							disabled={disabled}
							onClick={() => jump(current + ELLIPSIS_JUMP)}
							aria-label={`Jump forward ${ELLIPSIS_JUMP} pages`}
						>
							…
						</Button>
					);
				}
				return (
					<Button
						key={item}
						variant={item === current ? 'default' : 'outline'}
						size="icon"
						disabled={disabled}
						onClick={() =>
							item !== current && onChange(item, pageSize)
						}
						aria-current={item === current ? 'page' : undefined}
					>
						{item}
					</Button>
				);
			})}

			<Button
				variant="outline"
				size="icon"
				disabled={disabled || current >= totalPages}
				onClick={() => jump(current + 1)}
				aria-label="Next page"
			>
				<ChevronRightIcon />
			</Button>

			{showSizeChanger && (
				<Select
					value={String(pageSize)}
					onValueChange={(value) => onChange(1, Number(value))}
					disabled={disabled}
				>
					<SelectTrigger className="ml-1">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{options.map((size) => (
							<SelectItem key={size} value={String(size)}>
								{size} / page
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			{showQuickJumper && (
				<QuickJumper
					totalPages={totalPages}
					current={current}
					disabled={disabled}
					onJump={jump}
				/>
			)}
		</nav>
	);
}

// The "Go to [input]" jumper — Enter commits (clamped, no-op when
// unchanged), blur discards. The input never mirrors the current page: it is
// a jump surface, not a page display.
function QuickJumper({
	totalPages,
	current,
	disabled,
	onJump,
}: {
	totalPages: number;
	current: number;
	disabled: boolean;
	onJump: (target: number) => void;
}) {
	const [value, setValue] = useState('');

	const commit = () => {
		const next = Number(value);
		setValue('');
		if (value.trim() === '' || !Number.isInteger(next)) return;
		const clamped = Math.min(Math.max(next, 1), totalPages);
		if (clamped !== current) onJump(clamped);
	};

	return (
		<div className="ml-1 flex items-center gap-1.5 text-sm text-muted-foreground">
			<span>Go to</span>
			<Input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') commit();
				}}
				onBlur={() => setValue('')}
				inputMode="numeric"
				disabled={disabled}
				className="h-8 w-14 px-0 text-center"
				aria-label="Go to page"
			/>
		</div>
	);
}
