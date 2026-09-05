// The workspace home — members is the workspace's single surface.
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/workspaces/$slug/')({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: '/workspaces/$slug/members',
			params: { slug: params.slug },
		});
	},
});
