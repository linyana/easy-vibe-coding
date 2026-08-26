import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

interface MediaIconProps {
	className?: string;
	children: ReactNode;
}

export function MediaIcon({ className, children }: MediaIconProps) {
	return (
		<div
			className={cn(
				'inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted *:[svg:not([class*="size-"])]:size-6',
				className,
			)}
		>
			{children}
		</div>
	);
}
