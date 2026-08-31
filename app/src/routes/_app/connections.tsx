// The platform-scoped surface shell inside the app layout — this node is a
// parent of the platform pages (/connections/shopify, /connections/bigcommerce)
// and must NOT redirect here: beforeLoad runs on every matched ancestor, so a
// redirect on this node would loop when a child page loads. The bare
// /connections path itself redirects via the index route below.
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/connections')({
	component: () => <Outlet />,
});
