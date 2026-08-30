import { useState } from 'react';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { Card, ErrorState } from '@/components';
import { Button } from '@/components/ui/button';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';

// Gate, not a route: an authenticated session without a workspace has no
// workspace context yet — the picker replaces the whole app until the token
// is exchanged for a workspace-scoped one.
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
	const { workspace } = useGlobal();
	if (workspace == null) return <WorkspacePicker />;
	return <>{children}</>;
}

function WorkspacePicker() {
	const { account, update } = useGlobal();
	const [createOpen, setCreateOpen] = useState(false);

	const workspaces = useAPIQuery({
		queryKey: ['workspaces'],
		queryFn: () => API.workspaces.get(),
		toastError: false,
	});

	const switchMutation = useAPIMutation({
		call: (slug: string) => API.auth['switch-workspace'].post({ slug }),
		queryKey: ['auth'],
		// Entering a workspace is a context change, not a write — no toast.
		onSuccess: ({ token, workspace }) => update({ token, workspace }),
	});

	const { data, error, refetch } = workspaces;

	return (
		<div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
			<div className="w-full max-w-md space-y-4">
				<Card
					title="Choose a workspace"
					description="Your session is scoped to one workspace. Pick one to continue, or create a new one."
					actions={
						<Button
							variant="outline"
							onClick={() => setCreateOpen(true)}
						>
							<PlusIcon className="size-4" />
							Create workspace
						</Button>
					}
				>
					{error ? (
						<ErrorState
							error={error}
							onRetry={() => void refetch()}
						/>
					) : !data ? (
						<div className="flex justify-center py-8">
							<DotsRingLoading size={32} />
						</div>
					) : data.items.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No workspaces yet — create one to get started.
						</p>
					) : (
						<ul className="space-y-2">
							{data.items.map((workspace) => (
								<li key={workspace.slug}>
									<Button
										variant="outline"
										className="h-auto w-full justify-between px-4 py-3"
										disabled={switchMutation.isPending}
										onClick={() =>
											switchMutation.mutate(
												workspace.slug,
											)
										}
									>
										<span className="min-w-0 text-left">
											<span className="block truncate font-medium">
												{workspace.name}
											</span>
											<span className="block truncate text-xs text-muted-foreground">
												{workspace.slug}
											</span>
										</span>
										<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
									</Button>
								</li>
							))}
						</ul>
					)}
				</Card>
				{/* The admin entry lives here, not in the app sidebar: admin is
					platform-level, orthogonal to any workspace context — the
					picker is where an authenticated session chooses its context. */}
				{account?.isAdmin && (
					<Card
						icon={{ name: 'ShieldCheck' }}
						title="Admin console"
						description="Platform management — accounts and workspaces."
						actions={
							<Button asChild>
								<Link to="/admin">Open</Link>
							</Button>
						}
					/>
				)}
				<CreateWorkspaceDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					onCreated={switchMutation.mutate}
				/>
			</div>
		</div>
	);
}
