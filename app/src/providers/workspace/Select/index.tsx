import { useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { setLastWorkspaceSlug } from '@/libs/lastWorkspace';
import { Button } from '@/components/ui/button';
import { ErrorState, TitleBlock, SearchInput } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import type { WorkspaceResponse } from '@easy-vibe-coding/shared';
import type { UseAPIError } from '@/libs/error';
import { WorkspaceRow } from '../Row';
import { CreateWorkspaceDialog } from '../Create';
import type { TitleBlockProps } from '@/components/data/TitleBlock';

// The one workspace-selection flow, shared by the personal shell's Workspaces
// page and the app sidebar's nav dialog. The query runs only while `active` —
// the dialog fetches on open, never on page entry; the page passes true since
// it only exists to pick. The admin surface is reached by URL (/admin), never
// from here. Entering a workspace is pure navigation: the URL slug is the
// address, so the shell fetch + the server's per-request membership check do
// the work the token exchange used to do. The host decides WHERE entering
// lands — the picker page opens a new tab (keep picking), the in-app dialog
// replaces the current tab (a switch).
export function WorkspaceSelect({
	active,
	onSwitched,
	headerVariant,
	newTab = false,
}: {
	active: boolean;
	/** Fired after navigation — the dialog closes itself here. */
	onSwitched?: () => void;
	headerVariant: TitleBlockProps['variant'];
	/** Open the chosen workspace in a NEW TAB (selection page host — the
	 *  current page stays so the user can pick the next one). */
	newTab?: boolean;
}) {
	const { workspace } = useGlobal();
	const navigate = useNavigate();
	const router = useRouter();
	const [createOpen, setCreateOpen] = useState(false);
	const [search, setSearch] = useState<string | undefined>();

	const workspaces = useAPIQuery({
		queryKey: ['workspaces'],
		queryFn: () => API.workspaces.get(),
		enabled: active,
		toastError: false,
	});

	// The selected workspace's slug home — the slug page's own detail fetch
	// re-validates membership server-side.
	const enter = (slug: string) => {
		if (!newTab && slug === workspace?.slug) {
			// Already in it — nothing to navigate; just close the dialog.
			onSwitched?.();
			return;
		}
		setLastWorkspaceSlug(slug);
		if (newTab) {
			const href = router.buildLocation({
				to: '/workspaces/$slug',
				params: { slug },
			}).href;
			// Null-check doubles as the popup guard: null = the browser
			// blocked it (no user gesture — create-then-enter is async), so
			// fall back to replacing the current tab.
			const opened = window.open(href, '_blank');
			if (opened) {
				opened.opener = null;
				onSwitched?.();
				return;
			}
		}
		void navigate({ to: '/workspaces/$slug', params: { slug } });
		onSwitched?.();
	};

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
			<div className="space-y-3">
				<div className="space-y-2">
					<TitleBlock
						variant={headerVariant}
						title="Workspaces"
						description="Pick one to open — the URL addresses it, so nothing is exchanged."
					/>
					<SearchInput value={search} onChange={setSearch} />
				</div>
				<SelectList
					items={filtered}
					search={search}
					error={error}
					currentSlug={workspace?.slug}
					openInNewTab={newTab}
					onSelect={enter}
					onRetry={() => void refetch()}
				/>
				<Button
					variant="outline"
					className="w-full"
					onClick={() => setCreateOpen(true)}
				>
					<PlusIcon className="size-4" />
					Create workspace
				</Button>
			</div>
			<CreateWorkspaceDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={enter}
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
	openInNewTab,
	onSelect,
	onRetry,
}: {
	items: WorkspaceResponse[] | undefined;
	/** The active search keyword — an empty filtered list with one reads as "no
	 * matches" instead of "no workspaces yet". */
	search?: string;
	error: UseAPIError | null;
	/** The workspace the page currently renders — that row is marked, not navigable. */
	currentSlug?: string | null;
	/** Selecting opens the workspace in a new tab (see WorkspaceRow). */
	openInNewTab?: boolean;
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
						openInNewTab={openInNewTab}
						onSelect={onSelect}
					/>
				</li>
			))}
		</ul>
	);
}
