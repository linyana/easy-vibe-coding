import {
	connectionCreateSchema,
	type ConnectionCreate,
} from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';

export function CreateConnectionDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	// The page context fixes the platform — no selector; the create schema's
	// cross-field rule still runs against the seeded bigcommerce value.
	// superRefine (the cross-field platform rule) degrades z.infer — pin the
	// form value shape to the contract type explicitly.
	const form = useForm<typeof connectionCreateSchema, ConnectionCreate>({
		schema: connectionCreateSchema,
		initialValues: {
			name: '',
			platform: 'bigcommerce',
			shopUrl: '',
			storeHash: '',
			accessToken: '',
		},
		submit: {
			call: (values) => API.connections.post(values),
			queryKey: ['connections', 'bigcommerce'],
			successMessage: 'Connection created',
			onSuccess: () => onOpenChange(false),
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Add BigCommerce connection"
			description="Store the BigCommerce credentials — verified against the platform before saving."
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
					<FormSubmitButton form={form}>
						Test & connect
					</FormSubmitButton>
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
					tooltip="From the BigCommerce API path — e.g. abc123"
				>
					<Input placeholder="abc123" />
				</FormField>
				<FormField
					form={form}
					name="accessToken"
					label="Access token"
					tooltip="BigCommerce store access token (X-Auth-Token)"
				>
					<Input
						type="password"
						placeholder="BigCommerce store token"
						autoComplete="off"
					/>
				</FormField>
			</Form>
		</Dialog>
	);
}
