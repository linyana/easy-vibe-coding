import { useCallback, useState } from 'react';
import type { ConnectionsAction } from '../types';
import { ShopifyConnectionList } from './List';
import { CreateConnectionDialog } from './Create';
import { EditConnectionDialog } from './Edit';
import { DeleteConnectionDialog } from './Delete';

export const ShopifyConnections = () => {
	const [action, setAction] = useState<ConnectionsAction | null>(null);
	const [open, setOpen] = useState(false);

	const handleAction = useCallback((action: ConnectionsAction) => {
		setAction(action);
		setOpen(true);
	}, []);

	const handleOpenChange = useCallback((open: boolean) => setOpen(open), []);

	return (
		<>
			<ShopifyConnectionList onAction={handleAction} />
			{action?.kind === 'create' && (
				<CreateConnectionDialog
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'edit' && (
				// key remounts per row — initialValues are a snapshot, so the
				// form re-seeds from the new row (no sync effect).
				<EditConnectionDialog
					key={action.connection.id}
					connection={action.connection}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'delete' && (
				<DeleteConnectionDialog
					key={action.connection.id}
					connection={action.connection}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</>
	);
};
