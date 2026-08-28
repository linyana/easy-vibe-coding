import { useMemo } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import type { WorkspacesAction } from '../types';
import { useAPIList } from '@/hooks/useAPIList';
import { usePageHeader, useGlobal } from '@/hooks';
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
	onAction: (action: WorkspacesAction) => void;
}) {
	const list = useAPIList({
		queryKey: ['workspaces'],
		call: API.workspaces.get,
		getRowId: (workspace) => workspace.slug,
	});

	const isAdmin = useGlobal((s) => s.auth.user?.isAdmin ?? false);
	const columns = useMemo(
		() => createColumns({ onAction, isAdmin }),
		[onAction, isAdmin],
	);

	usePageHeader({ title: 'Workspaces' });

	return (
		<div className="space-y-4">
			<Card
				icon={{ name: 'Building2' }}
				title="Workspaces"
				description="The workspaces you belong to — pick one to work inside it, or create a new one."
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
								<SearchInput placeholder="Search by name…" />
							</FormField>
						</FieldGrid.Cell>
					</FieldGrid>

					<ListTable
						list={list}
						columns={columns}
						emptyMessage="No workspaces yet — create your first one"
					/>
				</div>
			</Card>
		</div>
	);
}
