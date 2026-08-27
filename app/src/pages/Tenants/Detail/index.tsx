import { useCallback, useMemo, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { UserPlusIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { TenantMembersListQuery } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIList } from '@/hooks/useAPIList';
import { usePageHeader } from '@/hooks';
import { useGlobal } from '@/hooks/useGlobal';
import {
	Actions,
	Card,
	ErrorState,
	features,
	FieldGrid,
	FormField,
	ListTable,
	SearchInput,
} from '@/components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/libs/dates';
import type { TenantMember, TenantsDetailAction } from '../types';
import { AddMemberDialog } from './AddMember';
import { RemoveMemberDialog } from './RemoveMember';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="mt-1 font-medium">{value}</dd>
		</div>
	);
}

function createMemberColumns({
	isOwner,
	actingUserId,
	onAction,
}: {
	isOwner: boolean;
	actingUserId: number | undefined;
	onAction: (action: TenantsDetailAction) => void;
}): ColumnDef<typeof features, TenantMember>[] {
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

export function TenantsDetail() {
	const { tenantId } = useParams({ from: '/_app/tenants/$tenantId' });
	const id = Number(tenantId);
	const actingUserId = useGlobal((s) => s.auth.user?.id);

	const tenantQuery = useAPIQuery({
		queryKey: ['tenants', 'detail', tenantId],
		queryFn: () => API.tenants({ tenantId: id }).get(),
		toastError: false,
	});

	const members = useAPIList({
		queryKey: ['tenants', tenantId, 'members'],
		// Annotated so TSearch infers as the members query (an arrow param
		// alone can't drive the generic — it would fall back to the base
		// { page, pageSize } shape and drop `search`).
		call: ({ query }: { query: TenantMembersListQuery }) =>
			API.tenants({ tenantId: id }).members.get({ query }),
		getRowId: (member) => String(member.userId),
	});

	const [action, setAction] = useState<TenantsDetailAction | null>(null);
	const [open, setOpen] = useState(false);
	const handleAction = useCallback((action: TenantsDetailAction) => {
		setAction(action);
		setOpen(true);
	}, []);
	const handleOpenChange = useCallback((open: boolean) => setOpen(open), []);

	const tenant = tenantQuery.data;
	const isOwner = tenant?.role === 'owner';

	const memberColumns = useMemo(
		() =>
			createMemberColumns({
				isOwner,
				actingUserId,
				onAction: handleAction,
			}),
		[isOwner, actingUserId, handleAction],
	);

	usePageHeader({
		title: tenant?.name ?? 'Tenant',
		back: { to: '/tenants', label: 'Back to tenants' },
	});

	return (
		<div className="space-y-4">
			{tenantQuery.isError && tenantQuery.error ? (
				<ErrorState
					error={tenantQuery.error}
					onRetry={() => void tenantQuery.refetch()}
				/>
			) : (
				<>
					{tenant && (
						<Card title="Details">
							<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<Field label="ID" value={tenant.id} />
								<Field label="Name" value={tenant.name} />
								<Field
									label="Your role"
									value={
										tenant.role === 'owner' ? (
											<Badge>Owner</Badge>
										) : tenant.role === 'member' ? (
											<Badge variant="secondary">
												Member
											</Badge>
										) : (
											<span className="text-muted-foreground">
												—
											</span>
										)
									}
								/>
								<Field
									label="Created"
									value={formatDateTime(tenant.createdAt)}
								/>
							</dl>
						</Card>
					)}

					<Card
						title="Members"
						description="Everyone with access to this tenant."
						actions={
							isOwner ? (
								<Button
									onClick={() =>
										handleAction({ kind: 'addMember' })
									}
								>
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
					</Card>
				</>
			)}

			{action?.kind === 'addMember' && (
				<AddMemberDialog
					tenantId={id}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'removeMember' && (
				<RemoveMemberDialog
					key={action.member.userId}
					tenantId={id}
					member={action.member}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</div>
	);
}
