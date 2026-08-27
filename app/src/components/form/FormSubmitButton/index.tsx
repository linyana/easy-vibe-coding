import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { IconObject } from '@/libs/icons';
import type { FormApi } from '@/hooks/useForm';

interface FormSubmitButtonProps<TValues extends object> {
	form: FormApi<TValues>;
	icon?: IconObject;
	className?: string;
	children: ReactNode;
}

/** The useForm submit-button wiring, written once: pending spinner,
 * validity-gated disabled state, and the disabled-reason tooltip. Every
 * submit surface for a FormApi composes this — the inline page-form button
 * and dialog-footer buttons alike — rather than deriving the trio itself.
 * Works outside its form element too: `form.id` (owned by the hook) reaches
 * it via the HTML `form` attribute, so no id threading at call sites. */
export function FormSubmitButton<TValues extends object>({
	form,
	icon,
	className,
	children,
}: FormSubmitButtonProps<TValues>) {
	return (
		<Button
			type="submit"
			form={form.id}
			icon={icon}
			loading={form.isPending}
			disabled={form.submitDisabledReason !== undefined}
			tooltip={form.submitDisabledReason}
			className={className}
		>
			{children}
		</Button>
	);
}
