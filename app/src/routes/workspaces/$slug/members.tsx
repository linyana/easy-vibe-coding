import { createFileRoute } from '@tanstack/react-router';
import { MembersPage } from '@/pages';

export const Route = createFileRoute('/workspaces/$slug/members')({
	component: MembersPage,
});
