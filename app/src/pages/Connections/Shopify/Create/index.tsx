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
	// cross-field rule still runs against the seeded shopify value.
	// superRefine (the cross-field platform rule) degrades z.infer — pin the
	// form value shape to the contract type explicitly.
	const form = useForm<typeof connectionCreateSchema, ConnectionCreate>({
		schema: connectionCreateSchema,
		initialValues: {
			name: '',
			platform: 'shopify',
			shopUrl: '',
			storeHash: '',
			accessToken: '',
		},
		submit: {
			call: (values) => API.connections.post(values),
			queryKey: ['connections', 'shopify'],
			successMessage: 'Connection created',
			onSuccess: () => onOpenChange(false),
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Add Shopify connection"
			description="Store the Shopify credentials — verified against the platform before saving."
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
					<Input placeholder="My Shopify store" />
				</FormField>
				<FormField
					form={form}
					name="shopUrl"
					label="Shop URL"
					tooltip="The store's myshopify.com domain — e.g. my-store.myshopify.com"
				>
					<Input placeholder="my-store.myshopify.com" />
				</FormField>
				<FormField
					form={form}
					name="accessToken"
					label="Access token"
					tooltip="Shopify Admin API access token (X-Shopify-Access-Token)"
				>
					<Input
						type="password"
						placeholder="shpat_…"
						autoComplete="off"
					/>
				</FormField>
			</Form>
		</Dialog>
	);
}
