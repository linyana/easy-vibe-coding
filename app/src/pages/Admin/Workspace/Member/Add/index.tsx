import { workspaceMemberAddSchema } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';

// Add a member by email — the account row is looked up server-side (missing
// account → 404, duplicate → 409; both land in the form's error surface, not
// a toast).
export function AddMemberDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { workspace } = useGlobal();

	const form = useForm({
		schema: workspaceMemberAddSchema,
		initialValues: { email: '' },
		submit: {
			call: (values) => API.workspaces.admin.members.post(values),
			queryKey: ['workspaces', 'admin', 'members', workspace?.id],
			successMessage: 'Member added',
			onSuccess: () => onOpenChange(false),
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			icon={{ name: 'UserPlus' }}
			title="Add member"
			description="The email must belong to a registered account."
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
					<FormSubmitButton form={form}>Add</FormSubmitButton>
				</>
			}
		>
			<Form form={form}>
				<FormField
					form={form}
					name="email"
					label="Email"
					tooltip="The account is added to the workspace with the member role."
				>
					<Input
						type="email"
						placeholder="account@example.com"
						autoComplete="off"
					/>
				</FormField>
			</Form>
		</Dialog>
	);
}
