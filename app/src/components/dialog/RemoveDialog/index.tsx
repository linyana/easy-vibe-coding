import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/dialog/Dialog';
import type { HeaderContentProps } from '@/components/data/Header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// The destructive write as seen by the dialog — a useAPIMutation result
// satisfies it structurally (no-variable destructive calls only).
export interface RemoveMutation {
	isPending: boolean;
	mutate: () => void;
}

export interface RemoveDialogProps extends HeaderContentProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/**
	 * The exact text the user must type to arm the destructive action. Must
	 * be non-empty: an empty confirmText would arm the action on an empty field.
	 */
	confirmText: string;
	mutation: RemoveMutation;
	confirmLabel?: string;
	children?: React.ReactNode;
}

// No error text and no Enter-to-confirm are deliberate — the armed button is
// the only "safe to proceed" signal.
export function RemoveDialog({
	open,
	onOpenChange,
	title,
	description,
	icon = { name: 'Trash2', style: 'destructive' },
	confirmText,
	mutation,
	confirmLabel = 'Delete',
	children,
}: RemoveDialogProps) {
	const [typed, setTyped] = useState('');
	const inputId = useId();
	const matches = typed === confirmText;

	// The dialog stays mounted across open/close (exit animation), so the
	// typed text must reset when it closes. (Switching target rows is the
	// page's job, via key remount.)
	useEffect(() => {
		if (!open) setTyped('');
	}, [open]);

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			icon={icon}
			title={title}
			description={description}
			footer={
				<>
					<Button
						variant="outline"
						disabled={mutation.isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						icon={icon}
						loading={mutation.isPending}
						disabled={!matches}
						onClick={() => mutation.mutate()}
					>
						{confirmLabel}
					</Button>
				</>
			}
		>
			{/* Label states the exact text to type; Radix auto-focuses the
				first focusable on open — the input is first, so typing can
				start immediately. */}
			{children}
			<div className="space-y-2">
				<Label htmlFor={inputId}>
					Type{' '}
					<span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] font-medium leading-snug text-foreground">
						{confirmText}
					</span>{' '}
					to confirm
				</Label>
				<Input
					id={inputId}
					value={typed}
					onChange={(e) => setTyped(e.target.value)}
					disabled={mutation.isPending}
					autoComplete="off"
					aria-invalid={typed.length > 0 && !matches}
				/>
			</div>
		</Dialog>
	);
}
