import { createFileRoute } from '@tanstack/react-router';
import { Tenants } from '@/pages';

export const Route = createFileRoute('/_app/tenants/')({
	component: Tenants,
});
