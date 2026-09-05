// The bare /workspaces path has no page of its own — point legacy links at
// the picker.
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/workspaces/')({
	beforeLoad: () => {
		throw redirect({ to: '/personal/workspaces' });
	},
});
