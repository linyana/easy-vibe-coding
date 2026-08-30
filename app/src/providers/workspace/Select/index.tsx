import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BriefcaseBusiness,
	PlusIcon,
	UserStar,
} from 'lucide-react';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { Button } from '@/components/ui/button';
import { Card, ErrorState, Header, MediaIcon } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import type { WorkspaceResponse } from '@easy-vibe-coding/shared';
import type { UseAPIError } from '@/libs/error';
import { WorkspaceRow } from '../Row';
import { CreateWorkspaceDialog } from '../Create';

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
	const navigate = useNavigate();
	const [createOpen, setCreateOpen] = useState(false);
	const [view, setView] = useState<'landing' | 'list'>('landing');

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

	if (account?.isAdmin && view === 'landing') {
		return (
			<>
				<div className="flex justify-between gap-8">
					<Card
						hoverable
						onClick={() => setView('list')}
						className="flex-1"
					>
						<div className="relative flex flex-col justify-center gap-6">
							<ArrowRightIcon className="absolute top-0 right-0 size-5 text-muted-foreground" />
							<MediaIcon>
								<BriefcaseBusiness className="size-6" />
							</MediaIcon>
							<Header
								title="Enter Workspace"
								description="View the latest activities of the project, team members and work area"
							/>
							<div className="flex items-center gap-2">
								<WorkspaceAvatarStack items={data?.items} />
								<p className="text-sm text-muted-foreground">
									{data?.items?.length ?? '…'} Workspaces
									available
								</p>
							</div>
						</div>
					</Card>
					<Card
						hoverable
						onClick={() => void navigate({ to: '/admin' })}
						className="flex-1"
					>
						<div className="relative flex flex-col justify-center gap-6">
							<ArrowRightIcon className="absolute top-0 right-0 size-5 text-muted-foreground" />
							<MediaIcon>
								<UserStar className="size-6" />
							</MediaIcon>
							<Header
								title="Enter Admin"
								description="Management platform users, workspace, permission policies and system settings"
							/>
							<p className="text-sm text-muted-foreground">
								Administrator privileges · platform level
							</p>
						</div>
					</Card>
				</div>
			</>
		);
	}

	return (
		<>
			{account?.isAdmin && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setView('landing')}
					className="-ml-2 mb-2"
				>
					<ArrowLeftIcon className="size-4" />
					Back to choice
				</Button>
			)}
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
			<CreateWorkspaceDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={switchMutation.mutate}
			/>
		</>
	);
}

// The Enter Workspace card's count line — a stack of overlapping initial
// circles (first letters), collapsing beyond two into a single "+N" circle.
function WorkspaceAvatarStack({ items }: { items?: WorkspaceResponse[] }) {
	if (!items?.length) return null;
	const shown = items.slice(0, 2);
	const rest = items.length - shown.length;
	return (
		<div className="flex -space-x-1.5">
			{shown.map((workspace) => (
				<span
					key={workspace.slug}
					className="flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background ring-2 ring-card"
				>
					{workspace.name.charAt(0).toUpperCase()}
				</span>
			))}
			{rest > 0 && (
				<span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background ring-2 ring-card">
					+{rest}
				</span>
			)}
		</div>
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
