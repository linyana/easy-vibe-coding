// The admin's entered workspace — addressed by URL slug (admins enter any
// workspace, membership-free; the admin:true guard is the gate, the
// WorkspaceProvider re-validates per request). The beforeLoad writes the slug
// as the request-scope workspace so the member-management API calls (admin +
// workspace guards) resolve the right workspace.
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { setCurrentWorkspaceSlug } from '@/libs/api';
import { WorkspaceProvider } from '@/providers/workspace';

export const Route = createFileRoute('/admin/workspaces/$slug')({
	beforeLoad: ({ params }) => {
		setCurrentWorkspaceSlug(params.slug);
	},
	component: AdminWorkspaceSlugLayout,
});

function AdminWorkspaceSlugLayout() {
	const { slug } = Route.useParams();
	return (
		<WorkspaceProvider
			key={slug}
			slug={slug}
			variant="admin"
			backTo="/admin/workspaces"
		>
			<Outlet />
		</WorkspaceProvider>
	);
}
