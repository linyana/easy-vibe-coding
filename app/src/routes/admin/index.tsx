import { createFileRoute } from '@tanstack/react-router';
import { AdminOverview } from '@/pages';

export const Route = createFileRoute('/admin/')({
	component: AdminOverview,
});
