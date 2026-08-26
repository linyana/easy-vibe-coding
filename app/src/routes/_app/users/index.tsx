// No validateSearch: list filters live in component state (useAPIList), not URL params.
import { createFileRoute } from '@tanstack/react-router';
import { Users } from '@/pages';

export const Route = createFileRoute('/_app/users/')({
	component: Users,
});
