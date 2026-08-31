import { useMemo } from 'react';
import { UserPlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import type { MemberAction } from '../types';
import { useAPIList } from '@/hooks/useAPIList';
import { Button } from '@/components/ui/button';
import {
	Card,
	FieldGrid,
	FormField,
	ListTable,
	SearchInput,
} from '@/components';
import { createColumns } from './columns';

// The member roster — the feature surface for the entered workspace: search +
// pagination via the admin members endpoint (by workspace id — the admin may
// not be a member). Writes (add/remove/role) flow through onAction; the
// workspace context is guaranteed by the fail-closed shell.
export function MemberList({
	onAction,
}: {
	onAction: (action: MemberAction) => void;
}) {
	const { workspace } = useGlobal();

	const list = useAPIList({
		// Keyed by id: switching workspace from the sidebar swaps the context
		// → a fresh fetch under the new workspace.
		queryKey: ['workspaces', 'admin', 'members', workspace?.id],
		call: API.workspaces.admin({ id: workspace!.id }).members.get,
	});

	const columns = useMemo(() => createColumns({ onAction }), [onAction]);

	return (
		<div className="space-y-4">
			<Card
				icon={{ name: 'Users' }}
				title={`Members of ${workspace?.name ?? '…'}`}
				description={`${workspace?.slug ?? ''} — search, change roles, add or remove. A workspace must keep at least one owner.`}
				actions={
					<Button onClick={() => onAction({ kind: 'add' })}>
						<UserPlusIcon className="size-4" />
						Add member
					</Button>
				}
			>
				<div className="space-y-4">
					<FieldGrid>
						<FieldGrid.Cell span={1}>
							<FormField
								control={list.control}
								name="search"
								label="Search"
							>
								<SearchInput placeholder="Search by name or email…" />
							</FormField>
						</FieldGrid.Cell>
					</FieldGrid>

					<ListTable
						list={list}
						columns={columns}
						emptyMessage="No members found"
					/>
				</div>
			</Card>
		</div>
	);
}
