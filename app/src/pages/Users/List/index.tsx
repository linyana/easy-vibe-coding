import { useMemo } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import type { UsersAction } from '../types';
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

export function UserList({
	onAction,
}: {
	onAction: (action: UsersAction) => void;
}) {
	const list = useAPIList({
		queryKey: ['users'],
		call: API.users.get,
		// Stable row identity — checkbox state survives refetches (an index
		// fallback would re-select shifted rows after a delete).
		getRowId: (user) => String(user.id),
	});

	const columns = useMemo(() => createColumns({ onAction }), [onAction]);

	usePageHeader({ title: 'Users' });

	return (
		<div className="space-y-4">
			<Card
				icon={{ name: 'Users' }}
				title="Users"
				description="The canonical CRUD example — search, filter, paginate, edit."
				actions={
					<Button onClick={() => onAction({ kind: 'create' })}>
						<PlusIcon className="size-4" />
						Create user
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
						emptyMessage="No users found"
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
											users: selected,
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
