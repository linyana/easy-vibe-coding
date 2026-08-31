import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

interface FloatingActionBarProps {
	/** Show/hide — the save bar appears only while there are unsaved
	 * changes, and tucks away once saved or cancelled. */
	visible: boolean;
	children: ReactNode;
}

/**
 * Fixed bottom-center save bar (A1's FloatingActionBar pattern) — slides up
 * and fades in when `visible`, tucks back down while staying mounted so the
 * exit animates. `pointer-events: none` on the shell keeps the page
 * scrollable/clickable; only the bar itself intercepts. `invisible` on hide
 * also drops it out of keyboard focus order (visibility transitions at the
 * end of the animation).
 */
export function FloatingActionBar({
	visible,
	children,
}: FloatingActionBarProps) {
	return (
		<div
			className={cn(
				'pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-300 ease-out',
				visible
					? 'translate-y-0 opacity-100 visible'
					: 'translate-y-[140%] opacity-0 invisible',
			)}
		>
			<div className="pointer-events-auto flex w-full max-w-2xl items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3 shadow-lg">
				{children}
			</div>
		</div>
	);
}
