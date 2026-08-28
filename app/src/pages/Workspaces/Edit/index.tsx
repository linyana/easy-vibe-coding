import { z } from 'zod';
import { workspaceFieldSchemas } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import type { Workspace } from '../types';

const renameWorkspaceFormSchema = z.object(workspaceFieldSchemas);

export function RenameWorkspaceDialog({
	workspace,
	open,
	onOpenChange,
}: {
	workspace: Workspace;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: renameWorkspaceFormSchema,
		initialValues: { name: workspace.name },
		submit: {
			call: (values) =>
				API.workspaces({
					workspaceSlug: workspace.slug,
				}).patch(values),
			queryKey: ['workspaces'],
			successMessage: 'Workspace renamed',
			onSuccess: () => onOpenChange(false),
			requireDirty: true,
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Rename workspace"
			description="Only the owner can rename the workspace. The URL (slug) stays the same."
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
					<Input placeholder="Workspace name" />
				</FormField>
			</Form>
		</Dialog>
	);
}
