import { useState } from 'react';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { Card, ErrorState } from '@/components';
import { Button } from '@/components/ui/button';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';

// Gate, not a route: an authenticated session without a workspaceId has no
// workspace context yet — the picker replaces the whole app until the token
// is exchanged for a workspace-scoped one.
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
	const { workspaceId } = useGlobal();
	if (workspaceId == null) return <WorkspacePicker />;
	return <>{children}</>;
}

function WorkspacePicker() {
	const { update } = useGlobal();
	const [createOpen, setCreateOpen] = useState(false);

	const workspaces = useAPIQuery({
		queryKey: ['workspaces'],
		queryFn: () => API.workspaces.get(),
		toastError: false,
	});

	const switchMutation = useAPIMutation({
		call: (workspaceId: number) =>
			API.auth['switch-workspace'].post({ workspaceId }),
		queryKey: ['auth'],
		// Entering a workspace is a context change, not a write — no toast.
		onSuccess: ({ token }, workspaceId) => update({ token, workspaceId }),
	});

	const { data, error, refetch } = workspaces;

	return (
		<div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
			<div className="w-full max-w-md">
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
								<li key={workspace.id}>
									<Button
										variant="outline"
										className="h-auto w-full justify-between px-4 py-3"
										disabled={switchMutation.isPending}
										onClick={() =>
											switchMutation.mutate(workspace.id)
										}
									>
										<span className="font-medium">
											{workspace.name}
										</span>
										<ArrowRightIcon className="size-4 text-muted-foreground" />
									</Button>
								</li>
							))}
						</ul>
					)}
				</Card>
				<CreateWorkspaceDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					onCreated={switchMutation.mutate}
				/>
			</div>
		</div>
	);
}
