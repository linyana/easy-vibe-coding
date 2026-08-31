import { useMemo } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import type { AdminWorkspacesAction } from '../types';
import { useAPIList } from '@/hooks/useAPIList';
import { usePageHeader } from '@/hooks';
import { Button } from '@/components/ui/button';
import {
	Card,
	FieldGrid,
	FormField,
	ListTable,
	SearchInput,
} from '@/components';
import { createColumns } from './columns';

export function WorkspaceList({
	onAction,
}: {
	onAction: (action: AdminWorkspacesAction) => void;
}) {
	const list = useAPIList({
		queryKey: ['workspaces', 'admin'],
		call: API.workspaces.admin.get,
	});

	const columns = useMemo(() => createColumns({ onAction }), [onAction]);

	usePageHeader({ title: 'Workspaces' });

	return (
		<div className="space-y-4">
			<Card
				icon={{ name: 'Building2' }}
				title="Workspaces"
				description="Every workspace on the platform — search, edit, manage members."
				actions={
					<Button onClick={() => onAction({ kind: 'create' })}>
						<PlusIcon className="size-4" />
						Create workspace
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
								<SearchInput placeholder="Search by slug or name…" />
							</FormField>
						</FieldGrid.Cell>
					</FieldGrid>

					<ListTable
						list={list}
						columns={columns}
						emptyMessage="No workspaces found"
						// A row click enters the workspace (the list is the entry
						// gate) — the row actions still hold the rest.
						onRowClick={(workspace) =>
							onAction({ kind: 'enter', workspace })
						}
					/>
				</div>
			</Card>
		</div>
	);
}
