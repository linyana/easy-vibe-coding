import { createFileRoute } from '@tanstack/react-router';
import { AdminWorkspaces } from '@/pages';

export const Route = createFileRoute('/admin/workspaces')({
	component: AdminWorkspaces,
});
