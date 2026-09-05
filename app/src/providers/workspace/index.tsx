import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import type { FileRoutesByTo } from '@/routeTree.gen';
import type { WorkspaceRef } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { ErrorState } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import { Button } from '@/components/ui/button';

// The slug-addressed workspace shell: the URL slug is the address, so the
// shell fetches the workspace's identity (the server re-validates membership
// per request — a removed member or a disabled workspace surfaces here, never
// as a phantom page) and exposes it as the session's display/query context.
// `key={slug}` on the mount site remounts per slug so children never render
// against a stale workspace.
export function WorkspaceProvider({
	slug,
	variant,
	backTo,
	children,
}: {
	slug: string;
	/** member = membership-gated user surface; admin = platform entry (any workspace, incl. disabled). */
	variant: 'member' | 'admin';
	/** Where the gate's "not this workspace" button goes (the picker that launched the shell). */
	backTo: keyof FileRoutesByTo;
	children: ReactNode;
}) {
	const { update } = useGlobal();

	// Both variants resolve the same WorkspaceRef shape from the request's
	// slug — member (role-gated) or admin/current (admin-gated, no membership
	// requirement). The workspace is committed to the store INSIDE the queryFn,
	// before the query's data ever marks children mountable: children that key
	// queries off workspace?.id/slug (member pages, rosters) therefore build
	// stable keys on their very first render. Committing in onSuccess (an
	// effect, post-render) would let children mount once with workspace null —
	// an undefined-key query fires, then the commit swaps the key and a second
	// request fires. Idempotent: refetches re-set the same value.
	const query = useAPIQuery<WorkspaceRef>({
		queryKey:
			variant === 'admin'
				? ['workspaces', 'admin', slug]
				: ['workspaces', slug],
		queryFn: async () => {
			const response =
				variant === 'admin'
					? await API.workspaces.admin.current.get()
					: await API.workspaces({ slug }).get();
			if (!response.error && response.data) {
				update({ workspace: response.data });
			}
			return response;
		},
		toastError: false,
	});

	// Leaving a slug shell drops the context — the next shell (or none) must
	// fetch its own, never read a stale neighbor's.
	useEffect(
		() => () => {
			update({ workspace: null });
		},
		[update],
	);

	if (query.error && !query.data) {
		return (
			<div className="space-y-4">
				<ErrorState
					error={query.error}
					onRetry={() => void query.refetch()}
				/>
				<div className="text-center">
					<Button asChild variant="outline">
						<Link to={backTo}>Back to workspace list</Link>
					</Button>
				</div>
			</div>
		);
	}

	if (!query.data) {
		return (
			<div className="flex justify-center py-16">
				<DotsRingLoading size={32} />
			</div>
		);
	}

	return <>{children}</>;
}
