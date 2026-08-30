import { accountResetPasswordSchema } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import type { Account } from '../types';

export function ResetPasswordDialog({
	account,
	open,
	onOpenChange,
}: {
	account: Account;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: accountResetPasswordSchema,
		initialValues: { password: '' },
		submit: {
			call: (values) =>
				API.accounts({ id: account.id }).password.patch(values),
			queryKey: ['accounts'],
			successMessage: 'Password reset',
			onSuccess: () => onOpenChange(false),
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			icon={{ name: 'KeyRound' }}
			title="Reset password"
			description={`Set a new password for ${account.name} (${account.email}).`}
			// Tooltip buttons precede the inputs in DOM order — Radix's default
			// first-focusable would light one up.
			preventAutoFocus
			footer={
				<>
					<Button
						variant="outline"
						disabled={form.isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<FormSubmitButton form={form}>Reset</FormSubmitButton>
				</>
			}
		>
			<Form form={form}>
				<FormField
					form={form}
					name="password"
					label="New password"
					tooltip="At least 8 characters. The account signs in with this from now on."
				>
					<Input
						type="password"
						placeholder="New password"
						autoComplete="new-password"
					/>
				</FormField>
			</Form>
		</Dialog>
	);
}
