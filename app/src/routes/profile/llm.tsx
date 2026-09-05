import { createFileRoute } from '@tanstack/react-router';
import { ProfileLlmPage } from '@/pages';

export const Route = createFileRoute('/profile/llm')({
	component: ProfileLlmPage,
});
