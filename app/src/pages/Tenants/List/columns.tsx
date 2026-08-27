import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Actions, features, type RowAction } from '@/components';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/libs/dates';
import type { Tenant, TenantsAction } from '../types';

function RoleBadge({ role }: { role: Tenant['role'] }) {
	if (role === 'owner') return <Badge>Owner</Badge>;
	if (role === 'member') return <Badge variant="secondary">Member</Badge>;
	// null — an admin viewing a tenant they don't belong to.
	return <span className="text-muted-foreground">—</span>;
}

export function createColumns({
	onAction,
	isAdmin,
}: {
	onAction: (action: TenantsAction) => void;
	isAdmin: boolean;
}): ColumnDef<typeof features, Tenant>[] {
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
					to="/tenants/$tenantId"
					params={{ tenantId: String(row.original.id) }}
					className="font-medium text-foreground underline-offset-4 hover:underline"
				>
					{row.original.name}
				</Link>
			),
		},
		{
			accessorKey: 'role',
			header: 'Role',
			cell: ({ row }) => <RoleBadge role={row.original.role} />,
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
			cell: ({ row }) => {
				const items: RowAction[] = [
					{
						label: 'View details',
						icon: { name: 'Eye' },
						onClick: () =>
							onAction({
								kind: 'detail',
								tenant: row.original,
							}),
					},
				];
				// Rename is owner-only for members — admins can rename any tenant
				// (the server enforces the same boundary).
				if (row.original.role === 'owner' || isAdmin) {
					items.push({
						label: 'Rename',
						icon: { name: 'Pencil' },
						onClick: () =>
							onAction({
								kind: 'rename',
								tenant: row.original,
							}),
					});
				}
				return <Actions items={items} />;
			},
		},
	];
}
