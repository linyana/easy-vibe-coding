import { API } from '@/libs/api';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { usePageHeader } from '@/hooks';
import { Card, ErrorState } from '@/components';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DotsRingLoading } from '@/components/loading/DotsRing';

const initials = (name: string) =>
	name
		.split(' ')
		.map((part) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase() || '?';

// The workspace's single surface: a read-only roster scoped by the token's
// workspaceSlug claim (member management is a later step).
export function MembersPage() {
	const { data, error, refetch } = useAPIQuery({
		queryKey: ['members'],
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
								<Avatar className="size-9 rounded-lg">
									<AvatarFallback className="rounded-lg text-xs">
										{initials(member.name)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">
										{member.name}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{member.email}
									</p>
								</div>
								<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
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
