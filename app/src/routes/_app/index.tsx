// The workspace has exactly one route: members. The bare app path lands there.
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/')({
	beforeLoad: () => {
		throw redirect({ to: '/members' });
	},
});
