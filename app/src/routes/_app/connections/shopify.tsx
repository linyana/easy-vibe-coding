import { createFileRoute } from '@tanstack/react-router';
import { ShopifyConnections } from '@/pages';

export const Route = createFileRoute('/_app/connections/shopify')({
	component: ShopifyConnections,
});
