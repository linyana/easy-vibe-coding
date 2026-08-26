import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/libs/utils';
import { getIcon, type IconObject } from '@/libs/icons';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

const buttonVariants = cva(
	"group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground hover:bg-primary/80',
				outline:
					'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
				ghost: 'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
				destructive:
					'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default:
					'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
				xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
				icon: 'size-8',
				'icon-xs':
					"size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
				'icon-sm':
					'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
				'icon-lg': 'size-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

// The dots-ring spinner mirrors the icon size each button variant would
// render for an svg (`[&_svg:not([class*='size-'])]:size-*`): only the xs and
// sm sizes differ from the 16px default.
const spinnerSizes: Partial<
	Record<NonNullable<VariantProps<typeof buttonVariants>['size']>, number>
> = {
	xs: 12,
	'icon-xs': 12,
	sm: 14,
	'icon-sm': 14,
};

function Button({
	className,
	variant = 'default',
	size = 'default',
	asChild = false,
	icon,
	loading = false,
	tooltip,
	disabled,
	children,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		/** Leading icon, by name — the shared icon vocabulary (`IconObject`,
		 * the same config Header/Dialog take, so one icon config drives a
		 * header box AND its button). Rendered inline at the variant's icon
		 * size; `style` tints the icon *box* and is ignored here. Swapped
		 * for the loading spinner while `loading`. */
		icon?: IconObject;
		loading?: boolean;
		/** Hover/focus tooltip — the "why is this disabled" explanation for
		 * action buttons. Hidden while `loading` (the spinner is its own
		 * explanation). A disabled button swallows pointer events, so the
		 * tooltip trigger becomes a wrapping focusable span that carries
		 * hover/focus instead. */
		tooltip?: string;
	}) {
	const Comp = asChild ? Slot.Root : 'button';
	const Icon = icon ? getIcon(icon.name) : null;

	const isDisabled = disabled || loading;

	const button = (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={isDisabled}
			{...props}
		>
			{loading ? (
				<DotsRingLoading size={spinnerSizes[size ?? 'default'] ?? 16} />
			) : Icon ? (
				<Icon />
			) : null}
			<Slot.Slottable>{children}</Slot.Slottable>
		</Comp>
	);

	if (!tooltip || loading) return button;

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<span
						tabIndex={isDisabled ? 0 : undefined}
						className="inline-flex"
					>
						{button}
					</span>
				</TooltipTrigger>
				<TooltipContent>{tooltip}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export { Button, buttonVariants };
