import { createFileRoute } from '@tanstack/react-router';
import { BigCommerceConnections } from '@/pages';

export const Route = createFileRoute(
	'/workspaces/$slug/connections/bigcommerce',
)({
	component: BigCommerceConnections,
});
