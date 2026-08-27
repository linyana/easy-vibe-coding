import { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { TenantsAction } from './types';
import { TenantList } from './List';
import { CreateTenantDialog } from './Create';
import { RenameTenantDialog } from './Edit';

export { TenantsDetail } from './Detail';

export const Tenants = () => {
	const navigate = useNavigate();
	const [action, setAction] = useState<TenantsAction | null>(null);
	const [open, setOpen] = useState(false);

	const handleAction = useCallback(
		(action: TenantsAction) => {
			// Detail is a navigation, not a dialog — /tenants/$tenantId is the
			// single detail surface (also linked from the name column).
			if (action.kind === 'detail') {
				void navigate({
					to: '/tenants/$tenantId',
					params: { tenantId: String(action.tenant.id) },
				});
				return;
			}
			setAction(action);
			setOpen(true);
		},
		[navigate],
	);

	const handleOpenChange = useCallback((open: boolean) => setOpen(open), []);

	return (
		<>
			<TenantList onAction={handleAction} />
			{action?.kind === 'create' && (
				<CreateTenantDialog
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'rename' && (
				// key remounts per row — initialValues are a snapshot, so the
				// form re-seeds from the new row.
				<RenameTenantDialog
					key={action.tenant.id}
					tenant={action.tenant}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</>
	);
};
