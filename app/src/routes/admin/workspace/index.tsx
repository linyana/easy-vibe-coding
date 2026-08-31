// The workspace surface's bare path — the member section is the current home.
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/workspace/')({
	beforeLoad: () => {
		throw redirect({ to: '/admin/workspace/member' });
	},
});
