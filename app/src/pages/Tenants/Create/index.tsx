import { tenantCreateSchema } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import { useGlobal } from '@/hooks/useGlobal';

export function CreateTenantDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: tenantCreateSchema,
		initialValues: { name: '' },
		submit: {
			call: (values) => API.tenants.post(values),
			// ['tenants'] prefix — invalidates the list AND the header switcher.
			queryKey: ['tenants'],
			successMessage: 'Tenant created',
			onSuccess: ({ id }) => {
				onOpenChange(false);
				// The creator becomes owner — make this the current tenant.
				useGlobal.getState().actions.setCurrentTenantId(id);
			},
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Create tenant"
			description="You become the owner of the new platform."
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
					<Input placeholder="e.g. Acme Platform" autoFocus />
				</FormField>
			</Form>
		</Dialog>
	);
}
