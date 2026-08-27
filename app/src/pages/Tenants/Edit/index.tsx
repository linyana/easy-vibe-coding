import { z } from 'zod';
import { tenantFieldSchemas } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import type { Tenant } from '../types';

const renameTenantFormSchema = z.object(tenantFieldSchemas);

export function RenameTenantDialog({
	tenant,
	open,
	onOpenChange,
}: {
	tenant: Tenant;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: renameTenantFormSchema,
		initialValues: { name: tenant.name },
		submit: {
			call: (values) =>
				API.tenants({ tenantId: tenant.id }).patch(values),
			queryKey: ['tenants'],
			successMessage: 'Tenant renamed',
			onSuccess: () => onOpenChange(false),
			requireDirty: true,
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Rename tenant"
			description="Only the owner can rename the platform."
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
					<Input placeholder="Tenant name" />
				</FormField>
			</Form>
		</Dialog>
	);
}
