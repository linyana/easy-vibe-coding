import type { ColumnDef } from '@tanstack/react-table';
import { Actions, features } from '@/components';
import { formatDateTime } from '@/libs/dates';
import { Badge } from '@/components/ui/badge';
import type { Account, AdminAccountsAction } from '../types';

export function createColumns({
	onAction,
}: {
	onAction: (action: AdminAccountsAction) => void;
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
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{ accessorKey: 'email', header: 'Email' },
		{
			accessorKey: 'isAdmin',
			header: 'Role',
			cell: ({ row }) =>
				row.original.isAdmin ? (
					<Badge>Admin</Badge>
				) : (
					<span className="text-muted-foreground">User</span>
				),
		},
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
							label: 'Edit',
							icon: { name: 'Pencil' },
							onClick: () =>
								onAction({
									kind: 'edit',
									account: row.original,
								}),
						},
						{
							label: 'Reset password',
							icon: { name: 'KeyRound' },
							onClick: () =>
								onAction({
									kind: 'resetPassword',
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
