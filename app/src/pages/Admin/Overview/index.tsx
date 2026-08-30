import {
	ArrowRightIcon,
	Building2Icon,
	CalendarDaysIcon,
	UserPlusIcon,
	UsersIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { useAPIQuery, usePageHeader } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState, MediaIcon } from '@/components';

function StatCard({
	icon,
	label,
	value,
	helper,
	footer,
}: {
	icon: ReactNode;
	label: string;
	value: ReactNode;
	helper?: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<Card>
			<CardContent className="flex items-start justify-between gap-4">
				<div className="min-w-0 space-y-1">
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className="text-2xl font-semibold tracking-tight tabular-nums">
						{value}
					</p>
					{helper ? (
						<p className="text-xs text-muted-foreground">
							{helper}
						</p>
					) : null}
				</div>
				<MediaIcon>{icon}</MediaIcon>
			</CardContent>
			{footer ? (
				<CardContent className="border-t px-0 py-1">
					{footer}
				</CardContent>
			) : null}
		</Card>
	);
}

function StatSkeleton() {
	return (
		<Card>
			<CardContent className="flex items-start justify-between gap-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-7 w-14" />
					<Skeleton className="h-3 w-32" />
				</div>
				<Skeleton className="size-10 rounded-md" />
			</CardContent>
		</Card>
	);
}

// The admin landing: platform-level counts for accounts and workspaces — two
// parallel stat queries, one per resource.
export function AdminOverview() {
	const accountsStats = useAPIQuery({
		queryKey: ['accounts', 'stats'],
		queryFn: () => API.accounts.stats.get(),
	});
	const workspacesStats = useAPIQuery({
		queryKey: ['workspaces', 'admin', 'stats'],
		queryFn: () => API.workspaces.admin.stats.get(),
	});

	usePageHeader({
		title: 'Overview',
		description: 'Platform-level counts for accounts and workspaces.',
	});

	const error = accountsStats.error ?? workspacesStats.error;
	const data =
		accountsStats.data && workspacesStats.data
			? { accounts: accountsStats.data, workspaces: workspacesStats.data }
			: null;
	const refetch = () => {
		void accountsStats.refetch();
		void workspacesStats.refetch();
	};

	return (
		<div className="space-y-6">
			{error ? (
				<ErrorState error={error} onRetry={refetch} />
			) : !data ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<StatSkeleton />
					<StatSkeleton />
					<StatSkeleton />
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<StatCard
						icon={<UsersIcon className="size-5" />}
						label="Total accounts"
						value={data.accounts.total}
						helper="All registered accounts"
						footer={
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="w-full justify-between rounded-none"
							>
								<Link to="/admin/accounts">
									Manage accounts
									<ArrowRightIcon className="size-4" />
								</Link>
							</Button>
						}
					/>
					<StatCard
						icon={<UserPlusIcon className="size-5" />}
						label="New accounts — 7 days"
						value={data.accounts.createdLast7Days}
					/>
					<StatCard
						icon={<CalendarDaysIcon className="size-5" />}
						label="New accounts — 30 days"
						value={data.accounts.createdLast30Days}
					/>
					<StatCard
						icon={<Building2Icon className="size-5" />}
						label="Total workspaces"
						value={data.workspaces.total}
						helper="All workspaces"
						footer={
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="w-full justify-between rounded-none"
							>
								<Link to="/admin/workspaces">
									Manage workspaces
									<ArrowRightIcon className="size-4" />
								</Link>
							</Button>
						}
					/>
					<StatCard
						icon={<UserPlusIcon className="size-5" />}
						label="New workspaces — 7 days"
						value={data.workspaces.createdLast7Days}
					/>
					<StatCard
						icon={<CalendarDaysIcon className="size-5" />}
						label="New workspaces — 30 days"
						value={data.workspaces.createdLast30Days}
					/>
				</div>
			)}
		</div>
	);
}
