import type { ReactNode } from 'react';
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
	/** Footer content — the dialog's buttons, composed by the caller. Rendered
	 * in the standard footer bar so spacing/alignment stay uniform across
	 * dialogs; omit for dialogs with no actions. */
	footer?: ReactNode;
	/** Prevent Radix's auto-focus on open — form dialogs need it: the
	 * field-help tooltip buttons precede the inputs in DOM order, so Radix's
	 * default first-focusable focus would light a tooltip. Action-first
	 * dialogs (RemoveDialog) leave it off — their input IS the first
	 * focusable. */
	preventAutoFocus?: boolean;
}

export function Dialog({
	open,
	onOpenChange,
	icon,
	title,
	description,
	children,
	footer,
	preventAutoFocus,
}: DialogProps) {
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

				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</DialogRoot>
	);
}
