import { createFileRoute } from '@tanstack/react-router';
import { PersonalWorkspacesPage } from '@/pages';

export const Route = createFileRoute('/personal/workspaces')({
	component: PersonalWorkspacesPage,
});
