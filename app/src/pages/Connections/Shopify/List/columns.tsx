import type { ColumnDef } from '@tanstack/react-table';
import { Actions, features } from '@/components';
import { formatDateTime } from '@/libs/dates';
import type { Connection, ConnectionsAction } from '../../types';

// No platform column — this page IS the Shopify page; the config field shows
// the shop URL (the one platform-specific piece worth reading at a glance).
const shopUrlOf = (connection: Connection): string =>
	'shopUrl' in connection.config ? connection.config.shopUrl : '—';

export function createColumns({
	onAction,
	onTest,
}: {
	onAction: (action: ConnectionsAction) => void;
	onTest: (id: number) => void;
}): ColumnDef<typeof features, Connection>[] {
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
		{
			accessorKey: 'config',
			header: 'Shop URL',
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{shopUrlOf(row.original)}
				</span>
			),
		},
		{
			accessorKey: 'hasToken',
			header: 'Token',
			cell: ({ row }) =>
				row.original.hasToken ? (
					<span className="text-muted-foreground">Configured</span>
				) : (
					<span className="text-destructive">Missing</span>
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
							label: 'Test connection',
							icon: { name: 'Zap' },
							onClick: () => onTest(row.original.id),
						},
						{
							label: 'Edit',
							icon: { name: 'Pencil' },
							onClick: () =>
								onAction({
									kind: 'edit',
									connection: row.original,
								}),
						},
						{
							label: 'Delete',
							icon: { name: 'Trash2', style: 'destructive' },
							onClick: () =>
								onAction({
									kind: 'delete',
									connection: row.original,
								}),
						},
					]}
				/>
			),
		},
	];
}
