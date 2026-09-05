import { createFileRoute } from '@tanstack/react-router';
import { PersonalAccountPage } from '@/pages';

export const Route = createFileRoute('/personal/')({
	component: PersonalAccountPage,
});
