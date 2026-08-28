import { workspaceCreateSchema } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import { useGlobal } from '@/hooks/useGlobal';

export function CreateWorkspaceDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: workspaceCreateSchema,
		initialValues: { name: '' },
		submit: {
			call: (values) => API.workspaces.post(values),
			// ['workspaces'] prefix — invalidates the list AND the header switcher.
			queryKey: ['workspaces'],
			successMessage: 'Workspace created',
			onSuccess: ({ slug }) => {
				onOpenChange(false);
				// The creator becomes owner — make this the current workspace.
				useGlobal.getState().actions.setCurrentWorkspaceId(slug);
			},
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Create workspace"
			description="You become the owner of the new workspace."
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
