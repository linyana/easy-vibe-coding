import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

// Layout vocabulary — layout lives here; fields stay dumb.
export function FieldGrid({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
				className,
			)}
		>
			{children}
		</div>
	);
}

export type FieldGridSpan = 1 | 2 | 3 | 4;

const SPAN_CLASSES: Record<FieldGridSpan, string> = {
	1: '',
	2: 'sm:col-span-2',
	3: 'sm:col-span-2 lg:col-span-3',
	4: 'sm:col-span-2 lg:col-span-4',
};

export function FieldGridCell({
	span = 1,
	className,
	children,
}: {
	/** Columns the cell spans on a desktop row (1/4 default). */
	span?: FieldGridSpan;
	className?: string;
	children: ReactNode;
}) {
	return <div className={cn(SPAN_CLASSES[span], className)}>{children}</div>;
}

FieldGrid.Cell = FieldGridCell;
