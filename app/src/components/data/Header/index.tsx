import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';
import { MediaIcon } from '../MediaIcon';
import { getIcon, iconStyleClasses, type IconObject } from '@/libs/icons';

export interface HeaderProps {
	icon?: IconObject;
	/**
	 * The header title. A plain string renders as a heading — h1 for the
	 * 'page' variant (a standalone page with no other heading), h2 otherwise
	 * (the same level Radix's DialogTitle defaults to, so string titles
	 * inside a dialog don't compete with the page's h1). Callers needing
	 * Radix's a11y pass a title element (DialogTitle) instead.
	 */
	title?: ReactNode;
	description?: ReactNode;
	/** 'profile' is the compact identity-row form (sidebar workspace switcher,
	 * account footer, picker/switch rows): an initial tile derived from the
	 * title + text-sm title + text-xs description, truncating. 'default' is
	 * the page/dialog header with an icon box. 'page' is the standalone
	 * page-level form with a larger title and description. */
	variant?: 'default' | 'profile' | 'page';
	/** Optional className to apply to the header. */
	className?: string;
}

/** The header's content props — the icon/title/description subset dialogs
 * pass straight through to Header. */
export type HeaderContentProps = Pick<
	HeaderProps,
	'icon' | 'title' | 'description'
>;

// Per-variant styles keyed by variant — layout classes, title/description
// typography, and the title element (h1/h2 vs. span for in-button rows).
const variantStyles = {
	default: {
		container: '',
		textContainer: '',
		titleElement: 'h2',
		title: 'text-xl font-semibold',
		description: 'text-sm text-muted-foreground',
		initialTile: false,
	},
	// Buttons default to text-align:center in the UA stylesheet — profile rows
	// live inside buttons, so the left alignment must be explicit.
	profile: {
		container: 'min-w-0 flex-1 text-left',
		textContainer: 'min-w-0 flex-1 leading-tight',
		titleElement: 'span',
		title: 'block truncate text-sm font-medium',
		description: 'truncate text-xs text-muted-foreground',
		initialTile: true,
	},
	page: {
		container: '',
		textContainer: '',
		titleElement: 'h1',
		title: 'text-3xl font-semibold tracking-tight',
		description: 'text-base text-muted-foreground',
		initialTile: false,
	},
} as const;

export function Header({
	icon,
	title,
	description,
	className,
	variant = 'default',
}: HeaderProps) {
	const Icon = icon ? getIcon(icon.name) : null;
	const style = variantStyles[variant];
	const Title = style.titleElement;
	const initial =
		typeof title === 'string' && title.length > 0
			? title.charAt(0).toUpperCase()
			: undefined;

	return (
		<div
			className={cn(
				'flex items-center gap-3',
				style.container,
				className,
			)}
		>
			{style.initialTile ? (
				<span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-sm font-medium text-muted-foreground">
					{initial}
				</span>
			) : (
				icon &&
				Icon && (
					<MediaIcon
						className={iconStyleClasses[icon.style ?? 'neutral']}
					>
						<Icon />
					</MediaIcon>
				)
			)}
			<div className={style.textContainer}>
				{typeof title === 'string' ? (
					<Title className={style.title}>{title}</Title>
				) : (
					title
				)}
				{description ? (
					<div className={style.description}>{description}</div>
				) : null}
			</div>
		</div>
	);
}
