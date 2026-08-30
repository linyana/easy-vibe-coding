import { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { AccountsAction } from './types';
import { AccountList } from './List';
import { CreateAccountDialog } from './Create';
import { EditAccountDialog } from './Edit';
import { DeleteAccountDialog } from './Delete';
import { DeleteAccountsDialog } from './Delete/batch-dialog';

export { AccountDetail } from './Detail';

export const Accounts = () => {
	const navigate = useNavigate();
	const [action, setAction] = useState<AccountsAction | null>(null);
	const [open, setOpen] = useState(false);

	const handleAction = useCallback(
		(action: AccountsAction) => {
			// Detail is a navigation, not a dialog — /accounts/$accountId is the single
			// detail surface (also linked from the name column).
			if (action.kind === 'detail') {
				void navigate({
					to: '/accounts/$accountId',
					params: { accountId: String(action.account.id) },
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
			<AccountList onAction={handleAction} />
			{action?.kind === 'create' && (
				<CreateAccountDialog
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'edit' && (
				// key remounts per row — initialValues are a snapshot, so the
				// form re-seeds from the new row (no sync effect).
				<EditAccountDialog
					key={action.account.id}
					account={action.account}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'delete' && (
				<DeleteAccountDialog
					key={action.account.id}
					account={action.account}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'deleteBatch' && (
				<DeleteAccountsDialog
					accounts={action.accounts}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</>
	);
};
