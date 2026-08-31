import { useCallback, useState } from 'react';
import type { AdminAccountsAction } from './types';
import { AccountList } from './List';
import { CreateAccountDialog } from './Create';
import { EditAccountDialog } from './Edit';
import { ToggleAdminDialog } from './ToggleAdmin';
import { ResetPasswordDialog } from './ResetPassword';
import { DeleteAccountDialog } from './Delete';
import { DeleteAccountsDialog } from './Delete/batch-dialog';

export const AdminAccounts = () => {
	const [action, setAction] = useState<AdminAccountsAction | null>(null);
	const [open, setOpen] = useState(false);

	const handleAction = useCallback((action: AdminAccountsAction) => {
		setAction(action);
		setOpen(true);
	}, []);

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
			{action?.kind === 'toggleAdmin' && (
				<ToggleAdminDialog
					key={action.account.id}
					account={action.account}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'resetPassword' && (
				<ResetPasswordDialog
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
