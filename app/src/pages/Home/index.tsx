import { Link } from '@tanstack/react-router';
import {
	ArrowRightIcon,
	CalendarDaysIcon,
	UserPlusIcon,
	UsersIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { API } from '@/libs/api';
import { useAPIQuery, usePageHeader } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
			{footer ? <CardFooter className="p-0">{footer}</CardFooter> : null}
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

function HomePage() {
	const stats = useAPIQuery({
		queryKey: ['accounts', 'stats'],
		queryFn: () => API.accounts.stats.get(),
	});

	usePageHeader({
		title: 'Dashboard',
		description:
			"An AI-first starter. Describe a feature — the AI builds it with the system's components. You review only the feature code.",
	});

	const { data, error, refetch } = stats;

	return (
		<div className="space-y-6">
			{error ? (
				<ErrorState error={error} onRetry={() => void refetch()} />
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
						value={data.total}
						helper="All registered accounts"
						footer={
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="w-full justify-between rounded-none"
							>
								<Link to="/accounts">
									Manage accounts
									<ArrowRightIcon className="size-4" />
								</Link>
							</Button>
						}
					/>
					<StatCard
						icon={<UserPlusIcon className="size-5" />}
						label="New — last 7 days"
						value={data.createdLast7Days}
						helper="Registrations in the last 7 days"
					/>
					<StatCard
						icon={<CalendarDaysIcon className="size-5" />}
						label="New — last 30 days"
						value={data.createdLast30Days}
						helper="Registrations in the last 30 days"
					/>
				</div>
			)}
		</div>
	);
}

export { HomePage };
