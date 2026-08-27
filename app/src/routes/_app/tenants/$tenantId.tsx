// The param `tenantId` is a URL string; the detail page coerces it to the
// API's numeric id.
import { createFileRoute } from '@tanstack/react-router';
import { TenantsDetail } from '@/pages';

export const Route = createFileRoute('/_app/tenants/$tenantId')({
	component: TenantsDetail,
});
