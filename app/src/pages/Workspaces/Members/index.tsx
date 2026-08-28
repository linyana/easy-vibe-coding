import { useCallback, useMemo, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { UserPlusIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { WorkspaceMembersListQuery } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { useAPIList } from '@/hooks/useAPIList';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { usePageHeader } from '@/hooks';
import { useGlobal } from '@/hooks/useGlobal';
import {
	Actions,
	Card,
	features,
	FieldGrid,
	FormField,
	ListTable,
	SearchInput,
} from '@/components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/libs/dates';
import type { WorkspaceMember, WorkspacesMembersAction } from '../types';
import { AddMemberDialog } from './AddMember';
import { RemoveMemberDialog } from './RemoveMember';

function createMemberColumns({
	isOwner,
	actingUserId,
	onAction,
}: {
	isOwner: boolean;
	actingUserId: number | undefined;
	onAction: (action: WorkspacesMembersAction) => void;
}): ColumnDef<typeof features, WorkspaceMember>[] {
	return [
		{ accessorKey: 'name', header: 'Name' },
		{ accessorKey: 'email', header: 'Email' },
		{
			accessorKey: 'role',
			header: 'Role',
			cell: ({ row }) =>
				row.original.role === 'owner' ? (
					<Badge>Owner</Badge>
				) : (
					<Badge variant="secondary">Member</Badge>
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
			cell: ({ row }) => {
				// Remove is owner-only and never targets yourself — the server
				// enforces the same two boundaries.
				if (!isOwner || row.original.userId === actingUserId) {
					return null;
				}
				return (
					<Actions
						items={[
							{
								label: 'Remove',
								icon: { name: 'Trash2', style: 'destructive' },
								onClick: () =>
									onAction({
										kind: 'removeMember',
										member: row.original,
									}),
							},
						]}
					/>
				);
			},
		},
	];
}

// The workspace's people — who has access and their roles. Owner-only actions
// (add/remove) are gated on the acting role from the workspace query.
export function WorkspacesMembers() {
	const { workspaceSlug } = useParams({
		from: '/_workspace/workspaces/$workspaceSlug',
	});
	const actingUserId = useGlobal((s) => s.auth.user?.id);

	const workspaceQuery = useAPIQuery({
		queryKey: ['workspaces', 'detail', workspaceSlug],
		queryFn: () => API.workspaces({ workspaceSlug }).get(),
		toastError: false,
	});

	const members = useAPIList({
		queryKey: ['workspaces', workspaceSlug, 'members'],
		// Annotated so TSearch infers as the members query (an arrow param
		// alone can't drive the generic — it would fall back to the base
		// { page, pageSize } shape and drop `search`).
		call: ({ query }: { query: WorkspaceMembersListQuery }) =>
			API.workspaces({ workspaceSlug }).members.get({ query }),
		getRowId: (member) => String(member.userId),
	});

	const [action, setAction] = useState<WorkspacesMembersAction | null>(null);
	const [open, setOpen] = useState(false);
	const handleAction = useCallback((action: WorkspacesMembersAction) => {
		setAction(action);
		setOpen(true);
	}, []);
	const handleOpenChange = useCallback((open: boolean) => setOpen(open), []);

	const isOwner = workspaceQuery.data?.role === 'owner';

	const memberColumns = useMemo(
		() =>
			createMemberColumns({
				isOwner,
				actingUserId,
				onAction: handleAction,
			}),
		[isOwner, actingUserId, handleAction],
	);

	usePageHeader({ title: 'Members' });

	return (
		<Card
			title="Members"
			description="Everyone with access to this workspace."
			actions={
				isOwner ? (
					<Button onClick={() => handleAction({ kind: 'addMember' })}>
						<UserPlusIcon className="size-4" />
						Add member
					</Button>
				) : undefined
			}
		>
			<div className="space-y-4">
				<FieldGrid>
					<FieldGrid.Cell span={1}>
						<FormField
							control={members.control}
							name="search"
							label="Search"
						>
							<SearchInput placeholder="Search by name or email…" />
						</FormField>
					</FieldGrid.Cell>
				</FieldGrid>

				<ListTable
					list={members}
					columns={memberColumns}
					emptyMessage="No members yet — add someone by email"
				/>
			</div>

			{action?.kind === 'addMember' && (
				<AddMemberDialog
					workspaceSlug={workspaceSlug}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'removeMember' && (
				<RemoveMemberDialog
					key={action.member.userId}
					workspaceSlug={workspaceSlug}
					member={action.member}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</Card>
	);
}
