import { workspaceCreateSchema } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';

export function CreateWorkspaceDialog({
	open,
	onOpenChange,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called with the new workspace's slug so the picker can enter it right away. */
	onCreated: (slug: string) => void;
}) {
	const form = useForm({
		schema: workspaceCreateSchema,
		initialValues: { name: '', slug: '' },
		submit: {
			call: (values) => API.workspaces.post(values),
			queryKey: ['workspaces'],
			successMessage: 'Workspace created',
			onSuccess: (workspace) => {
				onOpenChange(false);
				// Auto-enter: the creator is already its owner, so asking for a
				// second click on the list would be ceremony.
				onCreated(workspace.slug);
			},
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Create workspace"
			description="Workspaces scope your session. You become its owner."
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
					<Input placeholder="Workspace name" />
				</FormField>
				<FormField
					form={form}
					name="slug"
					label="Slug"
					tooltip="The unique handle for this workspace — lowercase letters, numbers, and single hyphens."
				>
					<Input placeholder="my-workspace" />
				</FormField>
			</Form>
		</Dialog>
	);
}
