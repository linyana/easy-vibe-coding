import { accountCreateSchema } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';

export function CreateAccountDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: accountCreateSchema,
		initialValues: { name: '', email: '', password: '' },
		submit: {
			call: (values) => API.accounts.post(values),
			queryKey: ['accounts'],
			successMessage: 'Account created',
			onSuccess: () => onOpenChange(false),
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Create account"
			description="Add a new account. The email must be unique."
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
					<FormSubmitButton form={form}>Create</FormSubmitButton>
				</>
			}
		>
			<Form form={form}>
				<FormField form={form} name="name" label="Name">
					<Input placeholder="Name" />
				</FormField>
				<FormField
					form={form}
					name="email"
					label="Email"
					tooltip="Used for login. Must be unique."
				>
					<Input placeholder="Email" autoComplete="email" />
				</FormField>
				<FormField
					form={form}
					name="password"
					label="Password"
					tooltip="Sets the initial password — the account can sign in with it right away."
				>
					<Input
						type="password"
						placeholder="Initial password"
						autoComplete="new-password"
					/>
				</FormField>
			</Form>
		</Dialog>
	);
}
