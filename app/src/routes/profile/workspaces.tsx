import { createFileRoute } from '@tanstack/react-router';
import { ProfileWorkspacesPage } from '@/pages';

export const Route = createFileRoute('/profile/workspaces')({
	component: ProfileWorkspacesPage,
});
