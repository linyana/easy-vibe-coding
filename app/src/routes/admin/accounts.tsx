import { createFileRoute } from '@tanstack/react-router';
import { AdminAccounts } from '@/pages';

export const Route = createFileRoute('/admin/accounts')({
	component: AdminAccounts,
});
