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
							label: 'Enter',
							icon: { name: 'LogIn' },
							onClick: () =>
								onAction({
									kind: 'enter',
									workspace: row.original,
								}),
						},
					]}
				/>
			),
		},
	];
}
