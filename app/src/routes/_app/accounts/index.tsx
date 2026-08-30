// No validateSearch: list filters live in component state (useAPIList), not URL params.
import { createFileRoute } from '@tanstack/react-router';
import { Accounts } from '@/pages';

export const Route = createFileRoute('/_app/accounts/')({
	component: Accounts,
});
