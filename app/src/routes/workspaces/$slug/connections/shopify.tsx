import { createFileRoute } from '@tanstack/react-router';
import { ShopifyConnections } from '@/pages';

export const Route = createFileRoute('/workspaces/$slug/connections/shopify')({
	component: ShopifyConnections,
});
