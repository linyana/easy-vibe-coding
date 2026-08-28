import { createFileRoute } from '@tanstack/react-router';
import { WorkspacesMembers } from '@/pages';

export const Route = createFileRoute(
	'/_workspace/workspaces/$workspaceSlug/members',
)({
	component: WorkspacesMembers,
});
