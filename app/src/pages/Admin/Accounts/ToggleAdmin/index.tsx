import { API } from '@/libs/api';
import { Dialog } from '@/components';
import { Button } from '@/components/ui/button';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { useGlobal } from '@/hooks/useGlobal';
import type { Account } from '../types';

export function ToggleAdminDialog({
	account,
	open,
	onOpenChange,
}: {
	account: Account;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	// Branches on the row snapshot's flag — the mutation target can't drift
	// while the dialog is open (the page remounts per row via key).
	const granting = !account.isAdmin;
	const { account: self } = useGlobal();
	// Self-revoke dead-ends server-side (400) — surface it in the dialog
	// instead of failing the request.
	const blocked = !granting && self?.id === account.id;

	const mutation = useAPIMutation({
		call: () =>
			API.accounts({ id: account.id }).admin.patch({
				isAdmin: granting,
			}),
		queryKey: ['accounts'],
		successMessage: granting
			? 'Admin access granted'
			: 'Admin access revoked',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			icon={
				granting
					? { name: 'ShieldCheck' }
					: { name: 'ShieldOff', style: 'destructive' }
			}
			title={granting ? 'Grant admin access' : 'Revoke admin access'}
			description={`${account.name} (${account.email})`}
			footer={
				<>
					<Button
						variant="outline"
						disabled={mutation.isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						variant={granting ? 'default' : 'destructive'}
						icon={
							granting
								? { name: 'ShieldCheck' }
								: { name: 'ShieldOff', style: 'destructive' }
						}
						loading={mutation.isPending}
						disabled={blocked}
						onClick={() => mutation.mutate()}
					>
						{granting ? 'Make admin' : 'Revoke admin'}
					</Button>
				</>
			}
		>
			{granting ? (
				<p>
					Making {account.name} an admin gives them full platform
					access — accounts, workspaces, and admin controls.
				</p>
			) : (
				<p>
					Revoking admin removes {account.name}&apos;s platform-level
					access. They can still sign in as a regular user.
				</p>
			)}
			{blocked && (
				<p className="text-sm text-destructive">
					You cannot revoke your own admin access — the platform must
					keep at least one admin.
				</p>
			)}
		</Dialog>
	);
}
