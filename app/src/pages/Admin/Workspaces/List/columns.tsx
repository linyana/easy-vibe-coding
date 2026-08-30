import type { ColumnDef } from '@tanstack/react-table';
import { Actions, features } from '@/components';
import { formatDateTime } from '@/libs/dates';
import type { AdminWorkspacesAction, Workspace } from '../types';

export function createColumns({
	onAction,
}: {
	onAction: (action: AdminWorkspacesAction) => void;
}): ColumnDef<typeof features, Workspace>[] {
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
			accessorKey: 'slug',
			header: 'Slug',
			cell: ({ row }) => (
				<span className="font-mono text-[13px]">
					{row.original.slug}
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
							label: 'Members',
							icon: { name: 'Users' },
							onClick: () =>
								onAction({
									kind: 'members',
									workspace: row.original,
								}),
						},
						{
							label: 'Edit',
							icon: { name: 'Pencil' },
							onClick: () =>
								onAction({
									kind: 'edit',
									workspace: row.original,
								}),
						},
						{
							label: 'Delete',
							icon: { name: 'Trash2', style: 'destructive' },
							onClick: () =>
								onAction({
									kind: 'delete',
									workspace: row.original,
								}),
						},
					]}
				/>
			),
		},
	];
}
