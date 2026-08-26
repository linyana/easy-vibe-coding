import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog as DialogRoot,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from '@/components/ui/dialog';
import { Header, type HeaderContentProps } from '@/components/data/Header';

export interface DialogProps extends HeaderContentProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
	cancelLabel?: string;
	actionLabel: string;
	actionVariant?: ComponentProps<typeof Button>['variant'];
	/** 'submit' for form dialogs (targets the form via `actionForm`); 'button' otherwise. */
	actionType?: 'button' | 'submit';
	actionForm?: string;
	/** Extra disable condition beyond pending (e.g. the type-to-confirm gate not armed). */
	actionDisabled?: boolean;
	/** Why the action is disabled — a tooltip on the disabled button (only set when there IS a reason). */
	actionDisabledReason?: string;
	isPending?: boolean;
	/** Button-mode action (actionType='button'): the click handler. */
	/** Button-mode action (actionType='button'): the click handler. */
	onAction?: () => void;
	/** Prevent Radix's auto-focus on open — form dialogs need it: the
	 * field-help tooltip buttons precede the inputs in DOM order, so Radix's
	 * default first-focusable focus would light a tooltip. RemoveDialog
	 * leaves it off — its confirm input IS the first focusable. */
	preventAutoFocus?: boolean;
}

export function Dialog({
	open,
	onOpenChange,
	icon,
	title,
	description,
	children,
	cancelLabel = 'Cancel',
	actionLabel,
	actionVariant = 'default',
	actionType = 'button',
	actionForm,
	actionDisabled,
	actionDisabledReason,
	isPending,
	onAction,
	preventAutoFocus,
}: DialogProps) {
	// Pending disables via `loading` (Button's own state — spinner + disabled);
	// `disabled` covers the extra gates: the caller's own condition and the
	// "there is a reason to explain" gate (a disabled button without an
	// explanation has none).
	const disabled = actionDisabled || actionDisabledReason !== undefined;

	return (
		<DialogRoot open={open} onOpenChange={onOpenChange}>
			<DialogContent
				onOpenAutoFocus={(event) => {
					if (preventAutoFocus) event.preventDefault();
				}}
			>
				{/* Radix needs a DialogTitle for the accessible name — a string
					title gets an sr-only Radix title so the dialog is named
					without duplicating visible markup; ReactNode titles are the
					caller's aria responsibility. */}
				{typeof title === 'string' && (
					<DialogTitle className="sr-only">{title}</DialogTitle>
				)}

				<Header icon={icon} title={title} description={description} />

				{children}

				<DialogFooter>
					<Button
						variant="outline"
						disabled={isPending}
						onClick={() => onOpenChange(false)}
					>
						{cancelLabel}
					</Button>
					<Button
						variant={actionVariant}
						type={actionType}
						form={actionForm}
						icon={icon}
						loading={isPending}
						tooltip={actionDisabledReason}
						disabled={disabled}
						onClick={onAction}
					>
						{actionLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</DialogRoot>
	);
}
