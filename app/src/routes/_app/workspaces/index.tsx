import { createFileRoute } from '@tanstack/react-router';
import { Workspaces } from '@/pages';

export const Route = createFileRoute('/_app/workspaces/')({
	component: Workspaces,
});
