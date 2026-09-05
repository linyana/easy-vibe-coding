// The workspace's platform connections — parent of the per-platform pages
// (Shopify / BigCommerce). Must NOT redirect here: beforeLoad runs on every
// matched ancestor, so a redirect on this node would loop when a child page
// loads. The bare /workspaces/$slug/connections path redirects via the index
// route below.
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/workspaces/$slug/connections')({
	component: () => <Outlet />,
});
