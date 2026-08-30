import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { Dialog, ErrorState } from '@/components';
import { Button } from '@/components/ui/button';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import { WorkspaceRow } from './WorkspaceRow';

// The nav's on-demand counterpart of the picker gate: same workspace list and
// the same switch mutation (token exchange → workspace context), in a dialog.
export function SwitchWorkspaceDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { workspace, update } = useGlobal();
	const [createOpen, setCreateOpen] = useState(false);

	const workspaces = useAPIQuery({
		queryKey: ['workspaces'],
		queryFn: () => API.workspaces.get(),
		toastError: false,
	});

	const switchMutation = useAPIMutation({
		call: (slug: string) => API.auth['switch-workspace'].post({ slug }),
		queryKey: ['auth'],
		// Context change, not a write — no toast (same as the picker). The
		// dialog closes once the new context is live.
		onSuccess: ({ token, workspace: next }) => {
			update({ token, workspace: next });
			onOpenChange(false);
		},
	});

	const { data, error, refetch } = workspaces;

	return (
		<>
			<Dialog
				open={open}
				onOpenChange={onOpenChange}
				title="Switch workspace"
				description="Your session moves to the selected workspace."
				footer={
					<Button
						variant="outline"
						disabled={switchMutation.isPending}
						onClick={() => setCreateOpen(true)}
					>
						<PlusIcon className="size-4" />
						Create workspace
					</Button>
				}
			>
				{error ? (
					<ErrorState error={error} onRetry={() => void refetch()} />
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
						{data.items.map((item) => {
							const current = item.slug === workspace?.slug;
							return (
								<li key={item.slug}>
									<WorkspaceRow
										workspace={item}
										current={current}
										disabled={switchMutation.isPending}
										onSelect={switchMutation.mutate}
									/>
								</li>
							);
						})}
					</ul>
				)}
			</Dialog>
			{/* Sibling of the dialog — both render through portals, so the create
				dialog stacks on top; onCreated auto-enters like the picker does. */}
			<CreateWorkspaceDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={switchMutation.mutate}
			/>
		</>
	);
}
