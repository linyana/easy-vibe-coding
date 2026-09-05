// The bare connections path — the default platform page is Shopify.
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/workspaces/$slug/connections/')({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: '/workspaces/$slug/connections/shopify',
			params: { slug: params.slug },
		});
	},
});
