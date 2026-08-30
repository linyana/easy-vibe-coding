import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Actions, features } from '@/components';
import { formatDateTime } from '@/libs/dates';
import type { Account, AccountsAction } from '../types';

export function createColumns({
	onAction,
}: {
	onAction: (action: AccountsAction) => void;
}): ColumnDef<typeof features, Account>[] {
	return [
		{
			accessorKey: 'id',
			header: 'ID',
			cell: ({ row }) => (
				<span className="text-muted-foreground tabular-nums">
					{row.original.id}
				</span>
			),
		},
		{
			accessorKey: 'name',
			header: 'Name',
			cell: ({ row }) => (
				<Link
					to="/accounts/$accountId"
					params={{ accountId: String(row.original.id) }}
					className="font-medium text-foreground underline-offset-4 hover:underline"
				>
					{row.original.name}
				</Link>
			),
		},
		{ accessorKey: 'email', header: 'Email' },
		{
			accessorKey: 'createdAt',
			header: 'Created',
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{formatDateTime(row.original.createdAt)}
				</span>
			),
		},
		{
			id: 'actions',
			meta: { align: 'center', fixed: 'right' },
			header: 'Actions',
			cell: ({ row }) => (
				<Actions
					items={[
						{
							label: 'View details',
							icon: { name: 'Eye' },
							onClick: () =>
								onAction({
									kind: 'detail',
									account: row.original,
								}),
						},
						{
							label: 'Edit',
							icon: { name: 'Pencil' },
							onClick: () =>
								onAction({
									kind: 'edit',
									account: row.original,
								}),
						},
						{
							label: 'Delete',
							icon: { name: 'Trash2', style: 'destructive' },
							onClick: () =>
								onAction({
									kind: 'delete',
									account: row.original,
								}),
						},
					]}
				/>
			),
		},
	];
}
