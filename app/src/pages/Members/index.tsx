import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { usePageHeader } from '@/hooks';
import { Card, ErrorState, TitleBlock } from '@/components';
import { DotsRingLoading } from '@/components/loading/DotsRing';

// The workspace's roster — a read-only list scoped to the workspace the URL
// addresses (the request carries X-Workspace-Slug; member management is a
// later step).
export function MembersPage() {
	const { workspace } = useGlobal();
	const { data, error, refetch } = useAPIQuery({
		// Scoped by the workspace slug (the cache key): the slug shell commits
		// the workspace before children mount, so this key is stable from the
		// first render — switching workspace remounts the shell (new slug →
		// fresh fetch, no stale roster).
		queryKey: ['members', workspace?.slug],
		queryFn: () => API.members.get(),
		toastError: false,
	});

	usePageHeader({ title: 'Members' });

	return (
		<div className="space-y-4">
			<Card
				title="Members"
				description="Everyone in the current workspace."
			>
				{error ? (
					<ErrorState error={error} onRetry={() => void refetch()} />
				) : !data ? (
					<div className="flex justify-center py-8">
						<DotsRingLoading size={32} />
					</div>
				) : data.items.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No members yet.
					</p>
				) : (
					<ul className="divide-y">
						{data.items.map((member) => (
							<li
								key={member.id}
								className="flex items-center gap-3 py-3"
							>
								<TitleBlock
									variant="profile"
									title={member.name}
									description={member.email}
								/>
								<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
									{member.role}
								</span>
							</li>
						))}
					</ul>
				)}
			</Card>
		</div>
	);
}
