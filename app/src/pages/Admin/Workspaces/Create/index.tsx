import { workspaceCreateSchema } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';

export function CreateWorkspaceDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: workspaceCreateSchema,
		initialValues: { name: '', slug: '' },
		submit: {
			call: (values) => API.workspaces.post(values),
			queryKey: ['workspaces', 'admin'],
			successMessage: 'Workspace created',
			onSuccess: () => onOpenChange(false),
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Create workspace"
			description="A workspace is a container for members. The slug is its unique, URL-safe identity."
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
					<Input placeholder="Name" />
				</FormField>
				<FormField
					form={form}
					name="slug"
					label="Slug"
					tooltip="Lowercase letters, numbers, and single hyphens. Must be unique."
				>
					<Input placeholder="my-workspace" />
				</FormField>
			</Form>
		</Dialog>
	);
}
