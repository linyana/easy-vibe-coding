import { createFileRoute } from '@tanstack/react-router';
import { BigCommerceConnections } from '@/pages';

export const Route = createFileRoute('/_app/connections/bigcommerce')({
	component: BigCommerceConnections,
});
