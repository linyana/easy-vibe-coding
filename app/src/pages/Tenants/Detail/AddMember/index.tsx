import { tenantMemberCreateSchema } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';

export function AddMemberDialog({
	tenantId,
	open,
	onOpenChange,
}: {
	tenantId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: tenantMemberCreateSchema,
		initialValues: { email: '' },
		submit: {
			call: (values) => API.tenants({ tenantId }).members.post(values),
			queryKey: ['tenants', tenantId, 'members'],
			successMessage: 'Member added',
			onSuccess: () => onOpenChange(false),
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Add member"
			description="They join as a member — only the owner can add people."
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
					<FormSubmitButton form={form}>Add</FormSubmitButton>
				</>
			}
		>
			<Form form={form}>
				<FormField
					form={form}
					name="email"
					label="Email"
					tooltip="The person must already have an account — register is the only way users exist."
				>
					<Input placeholder="you@example.com" autoComplete="off" />
				</FormField>
			</Form>
		</Dialog>
	);
}
