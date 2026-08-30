import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { Button } from '@/components/ui/button';
import { Dialog, ErrorState } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import type { WorkspaceResponse } from '@easy-vibe-coding/shared';
import type { UseAPIError } from '@/libs/error';
import { WorkspaceRow } from '../Row';
import { CreateWorkspaceDialog } from '../Create';
import { AdminConsoleEntry } from '../Admin';

// The nav's on-demand counterpart of the picker gate: the same selection flow
// in a dialog. The flow fetches on open (`active={open}`) — page entry stays quiet.
export function WorkspaceSelectDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Switch workspace"
			description="Your session moves to the selected workspace."
		>
			<WorkspaceSelect
				active={open}
				onSwitched={() => onOpenChange(false)}
			/>
		</Dialog>
	);
}

// The one workspace-selection flow, shared by the picker gate (embedded in a
// Card) and the nav dialog above. The query runs only while `active` — the
// dialog fetches on open, never on page entry; the gate passes true since it
// only mounts without a workspace.
export function WorkspaceSelect({
	active,
	onSwitched,
}: {
	active: boolean;
	/** Fired after the session switched — the dialog closes itself here. */
	onSwitched?: () => void;
}) {
	const { workspace, account, update } = useGlobal();
	const [createOpen, setCreateOpen] = useState(false);

	const workspaces = useAPIQuery({
		queryKey: ['workspaces'],
		queryFn: () => API.workspaces.get(),
		enabled: active,
		toastError: false,
	});

	const switchMutation = useAPIMutation({
		call: (slug: string) => API.auth['switch-workspace'].post({ slug }),
		queryKey: ['auth'],
		// Entering a workspace is a context change, not a write — no toast.
		onSuccess: ({ token, workspace }) => {
			update({ token, workspace });
			onSwitched?.();
		},
	});

	const { data, error, refetch } = workspaces;

	return (
		<>
			<div className="space-y-2">
				<SelectList
					items={data?.items}
					error={error}
					currentSlug={workspace?.slug}
					disabled={switchMutation.isPending}
					onSelect={switchMutation.mutate}
					onRetry={() => void refetch()}
				/>
				<Button
					variant="outline"
					className="w-full"
					disabled={switchMutation.isPending}
					onClick={() => setCreateOpen(true)}
				>
					<PlusIcon className="size-4" />
					Create workspace
				</Button>
			</div>
			{account?.isAdmin && (
				<div className="mt-4 border-t pt-4">
					<AdminConsoleEntry />
				</div>
			)}
			<CreateWorkspaceDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={switchMutation.mutate}
			/>
		</>
	);
}

// The list body both surfaces render — loading / error / empty / rows all live here.
function SelectList({
	items,
	error,
	currentSlug,
	disabled,
	onSelect,
	onRetry,
}: {
	items: WorkspaceResponse[] | undefined;
	error: UseAPIError | null;
	/** The session's current workspace slug — that row renders marked and non-interactive. */
	currentSlug?: string | null;
	disabled?: boolean;
	onSelect: (slug: string) => void;
	onRetry: () => void;
}) {
	if (error) return <ErrorState error={error} onRetry={onRetry} />;
	if (!items) {
		return (
			<div className="flex justify-center py-8">
				<DotsRingLoading size={32} />
			</div>
		);
	}
	if (items.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">
				No workspaces yet — create one to get started.
			</p>
		);
	}
	return (
		<ul className="space-y-2">
			{items.map((workspace) => (
				<li key={workspace.slug}>
					<WorkspaceRow
						workspace={workspace}
						current={workspace.slug === currentSlug}
						disabled={disabled}
						onSelect={onSelect}
					/>
				</li>
			))}
		</ul>
	);
}
