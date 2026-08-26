import { useId, type ReactNode } from 'react';
import { CircleAlertIcon } from 'lucide-react';
import { Dialog } from '@/components/dialog/Dialog';
import type { HeaderContentProps } from '@/components/data/Header';
import type { FormApi } from '@/hooks/useForm';

interface FormDialogProps<TValues extends object> extends HeaderContentProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	submitLabel?: string;
	form: FormApi<TValues>;
	children: ReactNode;
}

export function FormDialog<TValues extends object>({
	open,
	onOpenChange,
	icon,
	title,
	description,
	submitLabel = 'Submit',
	form,
	children,
}: FormDialogProps<TValues>) {
	const formId = useId();

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			icon={icon}
			title={title}
			description={description}
			actionLabel={submitLabel}
			actionType="submit"
			actionForm={formId}
			actionDisabled={form.submitDisabledReason !== undefined}
			actionDisabledReason={form.submitDisabledReason}
			isPending={form.isPending}
			preventAutoFocus
		>
			<form
				id={formId}
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					form.submit();
				}}
			>
				{children}
				{/* Whole-form error slot — pathless zod issues land here; field-
					anchored issues render inline on their FormField instead. */}
				{form.formError && (
					<div className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
						<CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
						{form.formError}
					</div>
				)}
			</form>
		</Dialog>
	);
}
