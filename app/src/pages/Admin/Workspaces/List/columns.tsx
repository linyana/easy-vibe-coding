import type { ColumnDef } from '@tanstack/react-table';
import { Actions, features } from '@/components';
import { formatDateTime } from '@/libs/dates';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { AdminWorkspacesAction, Workspace } from '../types';

export function createColumns({
	onAction,
	togglePending,
}: {
	onAction: (action: AdminWorkspacesAction) => void;
	togglePending: boolean;
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
			id: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const workspace = row.original;
				return (
					<div className="flex items-center gap-2">
						{workspace.disabled ? (
							<Badge variant="secondary">Disabled</Badge>
						) : (
							<span className="text-muted-foreground">
								Active
							</span>
						)}
						<Switch
							checked={!workspace.disabled}
							disabled={togglePending}
							aria-label={
								workspace.disabled
									? `Enable ${workspace.slug}`
									: `Disable ${workspace.slug}`
							}
							// The row click enters the workspace — the switch's click
							// must not bubble into it (same as the Actions trigger).
							onClick={(event) => event.stopPropagation()}
							onCheckedChange={(checked) =>
								onAction({
									kind: 'toggle',
									workspace,
									enable: checked,
								})
							}
						/>
					</div>
				);
			},
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
