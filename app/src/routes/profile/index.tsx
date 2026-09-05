import { createFileRoute } from '@tanstack/react-router';
import { ProfileAccountPage } from '@/pages';

export const Route = createFileRoute('/profile/')({
	component: ProfileAccountPage,
});
