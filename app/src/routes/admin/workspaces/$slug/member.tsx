import { createFileRoute } from '@tanstack/react-router';
import { AdminWorkspaceMember } from '@/pages';

export const Route = createFileRoute('/admin/workspaces/$slug/member')({
	component: AdminWorkspaceMember,
});
