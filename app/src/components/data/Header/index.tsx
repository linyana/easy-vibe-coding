import type { ReactNode } from 'react';
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
}

/** The header's content props — the icon/title/description subset dialogs
 * pass straight through to Header. */
export type HeaderContentProps = Pick<
	HeaderProps,
	'icon' | 'title' | 'description'
>;

export function Header({ icon, title, description }: HeaderProps) {
	const Icon = icon ? getIcon(icon.name) : null;
	return (
		<div className="flex items-center gap-3">
			{icon && Icon && (
				<MediaIcon
					className={iconStyleClasses[icon.style ?? 'neutral']}
				>
					<Icon />
				</MediaIcon>
			)}
			<div>
				{typeof title === 'string' ? (
					<h2 className="text-xl font-semibold">{title}</h2>
				) : (
					title
				)}
				{description ? (
					<div className="text-sm text-muted-foreground">
						{description}
					</div>
				) : null}
			</div>
		</div>
	);
}
