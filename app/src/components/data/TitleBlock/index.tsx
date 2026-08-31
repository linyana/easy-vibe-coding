import type { ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/libs/utils';
import { MediaIcon } from '../MediaIcon';
import { getIcon, iconStyleClasses, type IconObject } from '@/libs/icons';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

/** The leading slot — a preset icon (rendered in the MediaIcon box) or a
 * render function returning a custom element that replaces the box entirely
 * (e.g. an interactive back button — callers needing clickable icons can't
 * use the static `IconObject` form). */
export type TitleBlockIcon = IconObject | (() => ReactNode);

export interface TitleBlockProps {
	icon?: TitleBlockIcon;
	/**
	 * The block title. A plain string renders as a heading — h1 for the
	 * 'page' variant (a standalone page with no other heading), h2 otherwise
	 * (the same level Radix's DialogTitle defaults to, so string titles
	 * inside a dialog don't compete with the page's h1). Callers needing
	 * Radix's a11y pass a title element (DialogTitle) instead.
	 */
	title?: ReactNode;
	description?: ReactNode;
	/** Extra inline help — a question-mark icon next to the title with a
	 * hover tooltip (FormField's label tooltip pattern). */
	tip?: ReactNode;
	/**
	 * Right-side action slot — a settings row's control, a header's button,
	 * anything that sits opposite the text block. Rendered at the row's far
	 * right; omit for a plain text block.
	 */
	action?: ReactNode;
	/** 'profile' is the compact identity-row form (sidebar workspace switcher,
	 * account footer, picker/switch rows): an initial tile derived from the
	 * title + text-sm title + text-xs description, truncating. 'default' is
	 * the page/dialog header with an icon box. 'page' is the standalone
	 * page-level form with a larger title and description. 'settings' is the
	 * settings-row form (label + full-wrap description, no icon, action on
	 * the right): the "label left, control right" rows. */
	variant?: 'default' | 'profile' | 'page' | 'settings';
	/** Optional className to apply to the block. */
	className?: string;
}

/** The content subset dialogs/cards pass straight through — `icon` stays the
 * static `IconObject` form here: dialogs also compose it into action buttons
 * (RemoveDialog's confirm button), where a render function has no meaning. */
export type TitleBlockContentProps = {
	icon?: IconObject;
	title?: TitleBlockProps['title'];
	description?: TitleBlockProps['description'];
};

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
	// Settings rows: the opposite of profile — description must render in
	// full (no truncate) and at a readable size (text-sm, not text-xs), no
	// tile. The text block fills the row (flex-1) with the action at the
	// right; py-4 partners with a parent `divide-y` for the row separators.
	settings: {
		container: 'py-4 gap-4',
		textContainer: 'min-w-0 flex-1',
		titleElement: 'span',
		title: 'text-sm font-medium',
		description: 'text-sm text-muted-foreground',
		initialTile: false,
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

export function TitleBlock({
	icon,
	title,
	description,
	tip,
	action,
	className,
	variant = 'default',
}: TitleBlockProps) {
	const renderIcon = typeof icon === 'function' ? icon : null;
	const Icon = icon && typeof icon !== 'function' ? getIcon(icon.name) : null;
	const style = variantStyles[variant];
	const Title = style.titleElement;
	const initial =
		typeof title === 'string' && title.length > 0
			? title.charAt(0).toUpperCase()
			: undefined;

	const titleNode =
		typeof title === 'string' ? (
			<Title className={style.title}>{title}</Title>
		) : (
			title
		);

	return (
		<div
			className={cn(
				'flex items-center gap-3',
				style.container,
				className,
			)}
		>
			{renderIcon ? (
				renderIcon()
			) : style.initialTile ? (
				<span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-sm font-medium text-muted-foreground">
					{initial}
				</span>
			) : (
				typeof icon !== 'function' &&
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
				{/* tip needs the title on the same line — the flex wrapper only
				    exists when tip does, so truncate-based variants (profile)
				    keep their untouched rendering. */}
				{tip ? (
					<div className="flex items-center gap-1.5">
						{titleNode}
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										aria-label="More info"
										className="inline-flex shrink-0 items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
									>
										<CircleHelp className="size-3.5" />
									</button>
								</TooltipTrigger>
								<TooltipContent>{tip}</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				) : (
					titleNode
				)}
				{description ? (
					<div className={style.description}>{description}</div>
				) : null}
			</div>
			{action != null && <div className="shrink-0">{action}</div>}
		</div>
	);
}
