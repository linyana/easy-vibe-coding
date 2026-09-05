// A slug-addressed workspace — the URL is the address. The beforeLoad writes
// the slug as the request-scope workspace (libs/api injects it as the
// X-Workspace-Slug header on every API call from this subtree); the
// WorkspaceProvider then fetches the workspace's identity — the server
// re-validates membership per request, so a removed member or a disabled
// workspace surfaces here as the gate's error state, never as a phantom page.
// key={slug} remounts the subtree per workspace so pages never render against
// a stale context.
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { setCurrentWorkspaceSlug } from '@/libs/api';
import { LayoutProvider } from '@/providers';
import { WorkspaceProvider } from '@/providers/workspace';

export const Route = createFileRoute('/workspaces/$slug')({
	beforeLoad: ({ params }) => {
		setCurrentWorkspaceSlug(params.slug);
	},
	component: WorkspaceSlugLayout,
});

function WorkspaceSlugLayout() {
	const { slug } = Route.useParams();
	return (
		<WorkspaceProvider
			key={slug}
			slug={slug}
			variant="member"
			backTo="/personal/workspaces"
		>
			<LayoutProvider>
				<Outlet />
			</LayoutProvider>
		</WorkspaceProvider>
	);
}
