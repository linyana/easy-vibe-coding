import type { ReactNode } from 'react';
import {
	Card as CardRoot,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
} from '@/components/ui/card';
import { Header, type HeaderContentProps } from '@/components/data/Header';

export interface CardProps extends HeaderContentProps {
	children?: ReactNode;
	/** Right-aligned header actions — rendered top-right beside the header
	 * block. Typical value: `<Actions items={...} />`. */
	actions?: ReactNode;
	footer?: ReactNode;
	className?: string;
}

export function Card({
	icon,
	title,
	description,
	children,
	actions,
	footer,
	className,
}: CardProps) {
	const hasHeader = icon || title || description || actions;
	return (
		<CardRoot className={className}>
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
