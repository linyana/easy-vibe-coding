import type { ColumnDef } from '@tanstack/react-table';
import { Actions, features } from '@/components';
import { formatDateTime } from '@/libs/dates';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { Member, MemberAction } from '../types';

export function createColumns({
	onAction,
}: {
	onAction: (action: MemberAction) => void;
}): ColumnDef<typeof features, Member>[] {
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
			accessorKey: 'role',
			header: 'Role',
			cell: ({ row }) => (
				<Select
					value={row.original.role}
					onValueChange={(role) =>
						onAction({
							kind: 'role',
							member: row.original,
							role: role as Member['role'],
						})
					}
				>
					<SelectTrigger
						className="h-8 w-28"
						aria-label={`Role of ${row.original.name}`}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="owner">Owner</SelectItem>
						<SelectItem value="member">Member</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		{
			accessorKey: 'joinedAt',
			header: 'Joined',
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{formatDateTime(row.original.joinedAt)}
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
							label: 'Remove',
							icon: { name: 'UserMinus', style: 'destructive' },
							onClick: () =>
								onAction({
									kind: 'remove',
									member: row.original,
								}),
						},
					]}
				/>
			),
		},
	];
}
