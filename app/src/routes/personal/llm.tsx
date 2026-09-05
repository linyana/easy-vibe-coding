import { createFileRoute } from '@tanstack/react-router';
import { PersonalLlmPage } from '@/pages';

export const Route = createFileRoute('/personal/llm')({
	component: PersonalLlmPage,
});
