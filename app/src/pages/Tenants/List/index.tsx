import { useMemo } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import type { TenantsAction } from '../types';
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

export function TenantList({
	onAction,
}: {
	onAction: (action: TenantsAction) => void;
}) {
	const list = useAPIList({
		queryKey: ['tenants'],
		call: API.tenants.get,
		getRowId: (tenant) => String(tenant.id),
	});

	const isAdmin = useGlobal((s) => s.auth.user?.isAdmin ?? false);
	const columns = useMemo(
		() => createColumns({ onAction, isAdmin }),
		[onAction, isAdmin],
	);

	usePageHeader({ title: 'Tenants' });

	return (
		<div className="space-y-4">
			<Card
				icon={{ name: 'Building2' }}
				title="Tenants"
				description="The platforms you belong to — create one, or switch via the header."
				actions={
					<Button onClick={() => onAction({ kind: 'create' })}>
						<PlusIcon className="size-4" />
						Create tenant
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
						emptyMessage="No tenants yet — create your first one"
					/>
				</div>
			</Card>
		</div>
	);
}
