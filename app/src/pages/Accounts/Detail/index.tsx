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

export function AccountDetail() {
	const { accountId } = useParams({ from: '/_app/accounts/$accountId' });
	const {
		data: account,
		isError,
		error,
		refetch,
	} = useAPIQuery({
		queryKey: ['accounts', 'detail', accountId],
		queryFn: () => API.accounts({ id: Number(accountId) }).get(),
		toastError: false,
	});

	usePageHeader({
		title: account?.name ?? 'Account',
		back: { to: '/accounts', label: 'Back to accounts' },
	});

	return (
		<div className="space-y-4">
			{isError && error ? (
				<ErrorState error={error} onRetry={() => void refetch()} />
			) : account ? (
				<Card title="Details">
					<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label="ID" value={account.id} />
						<Field label="Name" value={account.name} />
						<Field label="Email" value={account.email} />
						<Field
							label="Created"
							value={formatDateTime(account.createdAt)}
						/>
						<Field
							label="Updated"
							value={formatDateTime(account.updatedAt)}
						/>
					</dl>
				</Card>
			) : null}
		</div>
	);
}
