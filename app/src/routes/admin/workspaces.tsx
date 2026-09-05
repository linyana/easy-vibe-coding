// The platform workspaces section: the bare path is the platform list
// (index.tsx); its $slug children are the admin's entered-workspace surface
// (member management) — a workspace addressed by URL slug, like the user app.
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/workspaces')({
	component: () => <Outlet />,
});
