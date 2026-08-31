import { z } from 'zod';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import type { Connection } from '../../types';

// Form-shape schema (the wire contract is connectionUpdateSchema): the token
// field stays optional and BLANK means "keep the current token" — the call
// strips it before hitting the wire, so the contract never sees an empty one.
const editConnectionFormSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(100),
	storeHash: z.string().trim().min(1, 'Store hash is required'),
	accessToken: z.string().trim().optional(),
});

export function EditConnectionDialog({
	connection,
	open,
	onOpenChange,
}: {
	connection: Connection;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm<typeof editConnectionFormSchema>({
		schema: editConnectionFormSchema,
		initialValues: {
			name: connection.name,
			storeHash:
				'storeHash' in connection.config
					? connection.config.storeHash
					: '',
			accessToken: '',
		},
		submit: {
			call: (values) => {
				// Form shape → wire shape: a blank token never leaves the form.
				const payload: Record<string, string> = {
					name: values.name,
					storeHash: values.storeHash,
				};
				if (values.accessToken)
					payload.accessToken = values.accessToken;
				return API.connections({
					id: connection.id,
				}).patch(payload);
			},
			queryKey: ['connections', connection.platform],
			successMessage: 'Connection updated',
			onSuccess: () => onOpenChange(false),
			requireDirty: true,
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Edit connection"
			description="Update the BigCommerce credentials — verified against the platform when they change."
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
					<FormSubmitButton form={form}>Test & save</FormSubmitButton>
				</>
			}
		>
			<Form form={form}>
				<FormField form={form} name="name" label="Name">
					<Input placeholder="My BigCommerce store" />
				</FormField>
				<FormField
					form={form}
					name="storeHash"
					label="Store hash"
					tooltip="From the BigCommerce API path"
				>
					<Input placeholder="abc123" />
				</FormField>
				<FormField
					form={form}
					name="accessToken"
					label="Access token"
					tooltip="Leave blank to keep the current token."
				>
					<Input
						type="password"
						placeholder="Leave blank to keep current"
						autoComplete="off"
					/>
				</FormField>
			</Form>
		</Dialog>
	);
}
