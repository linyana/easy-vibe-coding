import type { MouseEventHandler, ReactNode } from 'react';
import {
	Card as CardRoot,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
} from '@/components/ui/card';
import { Header, type HeaderContentProps } from '@/components/data/Header';
import { cn } from '@/libs/utils';

export interface CardProps extends HeaderContentProps {
	children?: ReactNode;
	/** Right-aligned header actions — rendered top-right beside the header
	 * block. Typical value: `<Actions items={...} />`. */
	actions?: ReactNode;
	footer?: ReactNode;
	className?: string;
	/** Renders the card as a clickable surface — pointer cursor + hover
	 * background. Pair with `onClick`. */
	hoverable?: boolean;
	onClick?: MouseEventHandler<HTMLDivElement>;
}

export function Card({
	icon,
	title,
	description,
	children,
	actions,
	footer,
	className,
	hoverable = false,
	onClick,
}: CardProps) {
	const hasHeader = icon || title || description || actions;
	return (
		<CardRoot
			className={cn(
				hoverable &&
					'cursor-pointer transition-[background-color] hover:bg-muted/50',
				className,
			)}
			onClick={onClick}
		>
			{hasHeader && (
				<CardHeader>
					<Header
						icon={icon}
						title={title}
						description={description}
					/>
					{actions && <CardAction>{actions}</CardAction>}
				</CardHeader>
			)}
			{children != null && <CardContent>{children}</CardContent>}
			{footer != null && <CardFooter>{footer}</CardFooter>}
		</CardRoot>
	);
}
