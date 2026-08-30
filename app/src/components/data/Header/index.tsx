import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';
import { MediaIcon } from '../MediaIcon';
import { getIcon, iconStyleClasses, type IconObject } from '@/libs/icons';

export interface HeaderProps {
	icon?: IconObject;
	/**
	 * The header title. A plain string renders as an h2 — the same level
	 * Radix's DialogTitle defaults to, so string titles inside a dialog
	 * don't compete with the page's h1. Callers needing Radix's a11y pass a
	 * title element (DialogTitle) instead.
	 */
	title?: ReactNode;
	description?: ReactNode;
	/** 'profile' is the compact identity-row form (sidebar workspace switcher,
	 * account footer, picker/switch rows): an initial tile derived from the
	 * title + text-sm title + text-xs description, truncating. 'default' is
	 * the page/dialog header with an icon box. */
	variant?: 'default' | 'profile';
}

/** The header's content props — the icon/title/description subset dialogs
 * pass straight through to Header. */
export type HeaderContentProps = Pick<
	HeaderProps,
	'icon' | 'title' | 'description'
>;

export function Header({
	icon,
	title,
	description,
	variant = 'default',
}: HeaderProps) {
	const Icon = icon ? getIcon(icon.name) : null;
	// Buttons default to text-align:center in the UA stylesheet — profile rows
	// live inside buttons, so the left alignment must be explicit.
	const profile = variant === 'profile';
	const initial =
		typeof title === 'string' && title.length > 0
			? title.charAt(0).toUpperCase()
			: undefined;

	return (
		<div
			className={cn(
				'flex items-center gap-3',
				profile && 'min-w-0 flex-1 text-left',
			)}
		>
			{profile ? (
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
			<div
				className={profile ? 'min-w-0 flex-1 leading-tight' : undefined}
			>
				{typeof title === 'string' ? (
					profile ? (
						<span className="block truncate text-sm font-medium">
							{title}
						</span>
					) : (
						<h2 className="text-xl font-semibold">{title}</h2>
					)
				) : (
					title
				)}
				{description ? (
					<div
						className={
							profile
								? 'truncate text-xs text-muted-foreground'
								: 'text-sm text-muted-foreground'
						}
					>
						{description}
					</div>
				) : null}
			</div>
		</div>
	);
}
