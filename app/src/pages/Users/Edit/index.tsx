import { z } from 'zod';
import { userFieldSchemas } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import type { User } from '../types';

const editUserFormSchema = z.object(userFieldSchemas);

export function EditUserDialog({
	user,
	open,
	onOpenChange,
}: {
	user: User;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: editUserFormSchema,
		initialValues: { name: user.name, email: user.email },
		submit: {
			call: (values) => API.users({ id: user.id }).patch(values),
			queryKey: ['users'],
			successMessage: 'User updated',
			onSuccess: () => onOpenChange(false),
			requireDirty: true,
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Edit user"
			description="Update the user's details. The email must stay unique."
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
					<FormSubmitButton form={form}>Save</FormSubmitButton>
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
					tooltip="Used for login and notifications. Must be unique across the workspace."
				>
					<Input placeholder="Email" autoComplete="email" />
				</FormField>
			</Form>
		</Dialog>
	);
}
