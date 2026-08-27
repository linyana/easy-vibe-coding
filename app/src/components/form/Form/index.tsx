import type { ReactNode } from 'react';
import { CircleAlertIcon } from 'lucide-react';
import { cn } from '@/libs/utils';
import { FormSubmitButton } from '@/components/form/FormSubmitButton';
import type { FormApi } from '@/hooks/useForm';

interface FormProps<TValues extends object> {
	form: FormApi<TValues>;
	/** Given => render the inline submit button carrying the shared
	 * FormSubmitButton wiring. Page forms set it; dialog forms leave it off —
	 * their submit button lives in the Dialog footer. */
	submitLabel?: string;
	submitClassName?: string;
	className?: string;
	children: ReactNode;
}

export function Form<TValues extends object>({
	form,
	submitLabel,
	submitClassName,
	className = 'space-y-4',
	children,
}: FormProps<TValues>) {
	return (
		<form
			id={form.id}
			className={className}
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
			{submitLabel !== undefined && (
				<FormSubmitButton
					form={form}
					className={cn('w-full', submitClassName)}
				>
					{submitLabel}
				</FormSubmitButton>
			)}
		</form>
	);
}
