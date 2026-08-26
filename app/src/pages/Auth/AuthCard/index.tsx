import { useId, type ReactNode } from 'react';
import { CircleAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components';
import type { HeaderContentProps } from '@/components/data/Header';
import type { FormApi } from '@/hooks/useForm';

interface AuthCardProps<TValues extends object> extends HeaderContentProps {
	submitLabel?: string;
	form: FormApi<TValues>;
	footer?: ReactNode;
	children: ReactNode;
}

export function AuthCard<TValues extends object>({
	icon,
	title,
	description,
	submitLabel = 'Submit',
	form,
	footer,
	children,
}: AuthCardProps<TValues>) {
	const formId = useId();

	return (
		<div className="flex min-h-dvh items-center justify-center p-4">
			<div className="w-full max-w-sm space-y-4">
				<Card icon={icon} title={title} description={description}>
					<form
						id={formId}
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							form.submit();
						}}
					>
						{children}
						{form.formError && (
							<div className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
								<CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
								{form.formError}
							</div>
						)}
						<Button
							type="submit"
							className="w-full"
							loading={form.isPending}
							disabled={form.submitDisabledReason !== undefined}
							tooltip={form.submitDisabledReason}
						>
							{submitLabel}
						</Button>
					</form>
				</Card>
				{footer && (
					<p className="text-center text-sm text-muted-foreground">
						{footer}
					</p>
				)}
			</div>
		</div>
	);
}
