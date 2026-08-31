import { createFileRoute } from '@tanstack/react-router';
import { AdminSettings } from '@/pages';

export const Route = createFileRoute('/admin/settings')({
	component: AdminSettings,
});
