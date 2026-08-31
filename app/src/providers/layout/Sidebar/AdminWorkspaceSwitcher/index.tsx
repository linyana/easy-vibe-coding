import { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { Dialog, ErrorState } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import { WorkspaceRow } from '@/providers/workspace/Row';

export function AdminWorkspaceSwitcher({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { workspace, update } = useGlobal();
	const [search, setSearch] = useState('');

	const list = useAPIQuery({
		queryKey: ['workspaces', 'admin'],
		queryFn: () =>
			API.workspaces.admin.get({ query: { page: 1, pageSize: 100 } }),
		enabled: open,
		toastError: false,
	});

	const switchMutation = useAPIMutation({
		call: (slug: string) => API.workspaces.admin.switch.post({ slug }),
		queryKey: ['auth'],
		// A context change, not a write — no toast.
		onSuccess: ({ token, workspace }) => {
			update({ token, workspace });
			onOpenChange(false);
		},
	});

	const keyword = search.trim().toLowerCase();
	const filtered = (list.data?.items ?? []).filter(
		(item) =>
			!keyword ||
			item.name.toLowerCase().includes(keyword) ||
			item.slug.toLowerCase().includes(keyword),
	);

	const { data, error, refetch } = list;

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			icon={{ name: 'Building2' }}
			title="Switch workspace"
			description="Jump to another workspace — the current page re-scopes to it."
			contentClassName="sm:w-3/5 sm:max-w-none"
			footer={
				<Button variant="outline" onClick={() => onOpenChange(false)}>
					Close
				</Button>
			}
		>
			<div className="space-y-3">
				<div className="relative">
					<SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search by name or slug…"
						className="pl-9"
					/>
				</div>
				{error ? (
					<ErrorState error={error} onRetry={() => void refetch()} />
				) : !data ? (
					<div className="flex justify-center py-8">
						<DotsRingLoading size={32} />
					</div>
				) : filtered.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No workspaces found.
					</p>
				) : (
					<ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
						{filtered.map((item) => (
							<li key={item.id}>
								<WorkspaceRow
									workspace={item}
									current={item.id === workspace?.id}
									disabled={switchMutation.isPending}
									onSelect={switchMutation.mutate}
								/>
							</li>
						))}
					</ul>
				)}
			</div>
		</Dialog>
	);
}
