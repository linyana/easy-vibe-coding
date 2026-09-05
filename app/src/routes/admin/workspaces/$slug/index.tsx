// The entered workspace's home — member management is the current section.
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/workspaces/$slug/')({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: '/admin/workspaces/$slug/member',
			params: { slug: params.slug },
		});
	},
});
