// The bare /connections path — the default platform page is Shopify.
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/connections/')({
	beforeLoad: () => {
		throw redirect({ to: '/connections/shopify' });
	},
});
