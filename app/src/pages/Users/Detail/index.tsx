import { useParams } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { usePageHeader } from '@/hooks';
import { Card, ErrorState } from '@/components';
import { formatDateTime } from '@/libs/dates';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="mt-1 font-medium">{value}</dd>
		</div>
	);
}

export function UserDetail() {
	const { userId } = useParams({ from: '/_app/users/$userId' });
	const {
		data: user,
		isError,
		error,
		refetch,
	} = useAPIQuery({
		queryKey: ['users', 'detail', userId],
		queryFn: () => API.users({ id: Number(userId) }).get(),
		toastError: false,
	});

	usePageHeader({
		title: user?.name ?? 'User',
		back: { to: '/users', label: 'Back to users' },
	});

	return (
		<div className="space-y-4">
			{isError && error ? (
				<ErrorState error={error} onRetry={() => void refetch()} />
			) : user ? (
				<Card title="Details">
					<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label="ID" value={user.id} />
						<Field label="Name" value={user.name} />
						<Field label="Email" value={user.email} />
						<Field
							label="Created"
							value={formatDateTime(user.createdAt)}
						/>
						<Field
							label="Updated"
							value={formatDateTime(user.updatedAt)}
						/>
					</dl>
				</Card>
			) : null}
		</div>
	);
}
