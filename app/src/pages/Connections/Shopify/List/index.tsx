import { useCallback, useMemo } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import type { ConnectionsAction } from '../../types';
import { useAPIList } from '@/hooks/useAPIList';
import { useAPIMutation } from '@/hooks/useAPIMutation';
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

export function ShopifyConnectionList({
	onAction,
}: {
	onAction: (action: ConnectionsAction) => void;
}) {
	const list = useAPIList({
		// This page's rows are exactly the shopify rows — the platform filter
		// rides the query so pagination/search never cross platforms.
		queryKey: ['connections', 'shopify'],
		initialSearch: { platform: 'shopify' },
		call: API.connections.get,
		getRowId: (connection) => String(connection.id),
	});

	// One-click credential check — success toasts, failures surface the
	// pipeline's message (rejected credentials / rate limit / timeout).
	const testMutation = useAPIMutation<number>({
		call: (id) => API.connections({ id }).test.post(),
		successMessage:
			'Connection verified — the platform accepted the credentials',
	});
	const handleTest = useCallback(
		(id: number) => {
			if (testMutation.isPending) return;
			testMutation.mutate(id);
		},
		[testMutation.isPending],
	);

	const columns = useMemo(
		() => createColumns({ onAction, onTest: handleTest }),
		[onAction, handleTest],
	);

	usePageHeader({ title: 'Shopify' });

	return (
		<div className="space-y-4">
			<Card
				icon={{ name: 'Plug' }}
				title="Shopify connections"
				description="Shopify accounts — store the credentials the product API calls out with."
				actions={
					<Button onClick={() => onAction({ kind: 'create' })}>
						<PlusIcon className="size-4" />
						Add Shopify connection
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
						emptyMessage="No Shopify connections yet"
					/>
				</div>
			</Card>
		</div>
	);
}
