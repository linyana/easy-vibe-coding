import type { ReactNode } from 'react';

import { cn } from '@/libs/utils';
import { DotsRingLoading } from '../DotsRing';

type LoadingProps = {
	loading?: boolean;
	children?: ReactNode;
	needMask?: boolean;
	/** The mask's z-index (the default sits above pinned table columns). */
	zIndex?: number;
	/** Mask inflation beyond the content in px (the content never moves). */
	maskInset?: number;
	size?: number;
};

export function Loading({
	loading,
	children,
	needMask,
	zIndex = 999,
	maskInset = 0,
	size,
}: LoadingProps) {
	if (needMask) {
		return (
			<div className="relative">
				<div
					className={cn(
						'absolute flex items-center justify-center bg-background/50 backdrop-blur-[2px]',
						!loading && 'hidden',
					)}
					style={{ zIndex, inset: -maskInset }}
				>
					{loading && <DotsRingLoading size={size} />}
				</div>
				{children}
			</div>
		);
	}

	if (!loading) return <>{children}</>;

	return (
		<div className="flex h-16 w-16 items-center justify-center">
			<DotsRingLoading size={size} />
		</div>
	);
}
