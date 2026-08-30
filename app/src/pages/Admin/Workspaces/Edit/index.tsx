import { z } from 'zod';
import { workspaceFieldSchemas } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import type { Workspace } from '../types';

const editWorkspaceFormSchema = z.object(workspaceFieldSchemas);

export function EditWorkspaceDialog({
	workspace,
	open,
	onOpenChange,
}: {
	workspace: Workspace;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: editWorkspaceFormSchema,
		initialValues: { name: workspace.name, slug: workspace.slug },
		submit: {
			call: (values) =>
				API.workspaces.admin({ id: workspace.id }).patch(values),
			queryKey: ['workspaces', 'admin'],
			successMessage: 'Workspace updated',
			onSuccess: () => onOpenChange(false),
			requireDirty: true,
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Edit workspace"
			description="Update the workspace's name or slug. The slug must stay unique."
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
					<FormSubmitButton form={form}>Save</FormSubmitButton>
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
