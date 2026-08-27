import { Link } from '@tanstack/react-router';
import {
	ArrowRightIcon,
	Building2Icon,
	CalendarDaysIcon,
	UserPlusIcon,
	UsersIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { API } from '@/libs/api';
import { useAPIQuery, usePageHeader } from '@/hooks';
import { useGlobal } from '@/hooks/useGlobal';
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

// The platform admin surface: global account + growth stats.
function AdminDashboard() {
	const stats = useAPIQuery({
		queryKey: ['users', 'stats'],
		queryFn: () => API.users.stats.get(),
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
						label="Total users"
						value={data.total}
						helper="All registered accounts"
						footer={
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="w-full justify-between rounded-none"
							>
								<Link to="/users">
									Manage users
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

// Regular users see only what belongs to them: the tenants they're a member
// of. Global stats stay behind the admin gate.
function MemberDashboard() {
	const tenants = useAPIQuery({
		queryKey: ['tenants', 'home'],
		queryFn: () => API.tenants.get({ query: { page: 1, pageSize: 100 } }),
		toastError: false,
	});

	const { data, error, refetch } = tenants;

	return (
		<div className="space-y-6">
			{error ? (
				<ErrorState error={error} onRetry={() => void refetch()} />
			) : !data ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<StatSkeleton />
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<StatCard
						icon={<Building2Icon className="size-5" />}
						label="Your tenants"
						value={data.total}
						helper="The platforms you belong to — your data lives inside them"
						footer={
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="w-full justify-between rounded-none"
							>
								<Link to="/tenants">
									Manage tenants
									<ArrowRightIcon className="size-4" />
								</Link>
							</Button>
						}
					/>
				</div>
			)}
		</div>
	);
}

function HomePage() {
	const isAdmin = useGlobal((s) => s.auth.user?.isAdmin ?? false);

	usePageHeader({
		title: 'Dashboard',
		description: isAdmin
			? 'Platform admin — global account management and growth.'
			: "An AI-first starter. Describe a feature — the AI builds it with the system's components. You review only the feature code.",
	});

	return isAdmin ? <AdminDashboard /> : <MemberDashboard />;
}

export { HomePage };
