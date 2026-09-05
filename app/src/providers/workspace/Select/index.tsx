import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { Button } from '@/components/ui/button';
import { ErrorState, TitleBlock, SearchInput } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import type { WorkspaceResponse } from '@easy-vibe-coding/shared';
import type { UseAPIError } from '@/libs/error';
import { WorkspaceRow } from '../Row';
import { CreateWorkspaceDialog } from '../Create';
import type { TitleBlockProps } from '@/components/data/TitleBlock';

// The one workspace-selection flow, shared by the profile shell's Workspaces
// page (entering a workspace leaves the profile for the app) and the app
// sidebar's nav dialog. The query runs only while `active` — the dialog
// fetches on open, never on page entry; the page passes true since it only
// exists to pick. The admin surface is reached by URL (/admin), never from
// here — this picker only ever chooses workspaces.
export function WorkspaceSelect({
	active,
	onSwitched,
	headerVariant,
}: {
	active: boolean;
	/** Fired after the session switched — the dialog closes itself here. */
	onSwitched?: () => void;
	headerVariant: TitleBlockProps['variant'];
}) {
	const { workspace, update } = useGlobal();
	const [createOpen, setCreateOpen] = useState(false);
	const [search, setSearch] = useState<string | undefined>();

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

	// Client-side filter: the membership-scoped list is unpaginated and small,
	// so no server round-trip — the search narrows the already-fetched roster.
	const keyword = search?.trim().toLowerCase();
	const filtered = (data?.items ?? []).filter(
		(item) =>
			!keyword ||
			item.name.toLowerCase().includes(keyword) ||
			item.slug.toLowerCase().includes(keyword),
	);

	return (
		<>
			<TitleBlock
				variant={headerVariant}
				title="Choose workspace"
				description="Pick the workspace you want to enter — the session re-scopes to it."
				className="pb-4"
			/>
			<div className="space-y-2">
				{data && data.items.length > 0 && (
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search by name or slug…"
					/>
				)}
				<SelectList
					items={filtered}
					search={search}
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

// The list body — loading / error / empty / rows all live here.
function SelectList({
	items,
	search,
	error,
	currentSlug,
	disabled,
	onSelect,
	onRetry,
}: {
	items: WorkspaceResponse[] | undefined;
	/** The active search keyword — an empty filtered list with one reads as "no
	 * matches" instead of "no workspaces yet". */
	search?: string;
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
				{search
					? 'No workspaces match your search.'
					: 'No workspaces yet — create one to get started.'}
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
