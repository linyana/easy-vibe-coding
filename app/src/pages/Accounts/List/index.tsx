import { useMemo } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import type { AccountsAction } from '../types';
import { useAPIList } from '@/hooks/useAPIList';
import { usePageHeader } from '@/hooks';
import { Button } from '@/components/ui/button';
import {
	Card,
	DateRangePicker,
	FieldGrid,
	FormField,
	ListTable,
	SearchInput,
} from '@/components';
import { createColumns } from './columns';

export function AccountList({
	onAction,
}: {
	onAction: (action: AccountsAction) => void;
}) {
	const list = useAPIList({
		queryKey: ['accounts'],
		call: API.accounts.get,
		// Stable row identity — checkbox state survives refetches (an index
		// fallback would re-select shifted rows after a delete).
		getRowId: (account) => String(account.id),
	});

	const columns = useMemo(() => createColumns({ onAction }), [onAction]);

	usePageHeader({ title: 'Accounts' });

	return (
		<div className="space-y-4">
			<Card
				icon={{ name: 'Users' }}
				title="Accounts"
				description="The canonical CRUD example — search, filter, paginate, edit."
				actions={
					<Button onClick={() => onAction({ kind: 'create' })}>
						<PlusIcon className="size-4" />
						Create account
					</Button>
				}
			>
				<div className="space-y-4">
					<FieldGrid>
						<FieldGrid.Cell span={1}>
							<FormField
								control={list.control}
								name="search"
								label="Search"
							>
								<SearchInput placeholder="Search by name or email…" />
							</FormField>
						</FieldGrid.Cell>
						<FieldGrid.Cell span={1}>
							<FormField
								control={list.control}
								name="createdRange"
								label="Created"
							>
								<DateRangePicker aria-label="Created" />
							</FormField>
						</FieldGrid.Cell>
					</FieldGrid>

					<ListTable
						list={list}
						columns={columns}
						emptyMessage="No accounts found"
						selection={{
							actions: (selected) => [
								{
									label: 'Delete',
									icon: {
										name: 'Trash2',
										style: 'destructive',
									},
									onClick: () =>
										onAction({
											kind: 'deleteBatch',
											accounts: selected,
										}),
								},
							],
						}}
					/>
				</div>
			</Card>
		</div>
	);
}
