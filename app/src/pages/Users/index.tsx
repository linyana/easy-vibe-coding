import { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { UsersAction } from './types';
import { UserList } from './List';
import { CreateUserDialog } from './Create';
import { EditUserDialog } from './Edit';
import { DeleteUserDialog } from './Delete';
import { DeleteUsersDialog } from './Delete/batch-dialog';

export { UserDetail } from './Detail';

export const Users = () => {
	const navigate = useNavigate();
	const [action, setAction] = useState<UsersAction | null>(null);
	const [open, setOpen] = useState(false);

	const handleAction = useCallback(
		(action: UsersAction) => {
			// Detail is a navigation, not a dialog — /users/$userId is the single
			// detail surface (also linked from the name column).
			if (action.kind === 'detail') {
				void navigate({
					to: '/users/$userId',
					params: { userId: String(action.user.id) },
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
			<UserList onAction={handleAction} />
			{action?.kind === 'create' && (
				<CreateUserDialog open={open} onOpenChange={handleOpenChange} />
			)}
			{action?.kind === 'edit' && (
				// key remounts per row — initialValues are a snapshot, so the
				// form re-seeds from the new row (no sync effect).
				<EditUserDialog
					key={action.user.id}
					user={action.user}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'delete' && (
				<DeleteUserDialog
					key={action.user.id}
					user={action.user}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'deleteBatch' && (
				<DeleteUsersDialog
					users={action.users}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</>
	);
};
