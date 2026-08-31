import { useState, type FormEvent } from 'react';
import { UserMinusIcon, UserPlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import { Dialog, ErrorState } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { MemberRole } from '@easy-vibe-coding/shared';
import type { Workspace } from '../types';

// Member management for one workspace: roster + add-by-email + role change +
// remove. The server enforces the "at least one owner" invariant — a demote or
// remove that would leave the workspace owner-less comes back as a 409 with a
// message (default mutation toast).
export function MembersDialog({
	workspace,
	open,
	onOpenChange,
}: {
	workspace: Workspace;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [email, setEmail] = useState('');

	const members = useAPIQuery({
		queryKey: ['workspaces', 'admin', 'members', workspace.id],
		queryFn: () =>
			API.workspaces.admin({ id: workspace.id }).members.get({
				query: { page: 1, pageSize: 100 },
			}),
		enabled: open,
		toastError: false,
	});

	const addMember = useAPIMutation({
		call: (value: string) =>
			API.workspaces.admin({ id: workspace.id }).members.post({
				email: value,
			}),
		queryKey: ['workspaces', 'admin', 'members', workspace.id],
		successMessage: 'Member added',
		onSuccess: () => setEmail(''),
	});

	const changeRole = useAPIMutation({
		call: ({ accountId, role }: { accountId: number; role: MemberRole }) =>
			API.workspaces
				.admin({ id: workspace.id })
				.members({ accountId })
				.patch({ role }),
		queryKey: ['workspaces', 'admin', 'members', workspace.id],
		successMessage: 'Role updated',
	});

	const removeMember = useAPIMutation({
		call: (accountId: number) =>
			API.workspaces
				.admin({ id: workspace.id })
				.members({ accountId })
				.delete(),
		queryKey: ['workspaces', 'admin', 'members', workspace.id],
		successMessage: 'Member removed',
	});

	const handleAdd = (event: FormEvent) => {
		event.preventDefault();
		if (!email.trim()) return;
		addMember.mutate(email.trim());
	};

	const { data, error, refetch } = members;

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			icon={{ name: 'Users' }}
			title={`Members of ${workspace.name}`}
			description="Add by email, change roles, or remove. A workspace must keep at least one owner."
			footer={
				<Button variant="outline" onClick={() => onOpenChange(false)}>
					Close
				</Button>
			}
		>
			<div className="space-y-4">
				<form onSubmit={handleAdd} className="flex items-end gap-2">
					<div className="min-w-0 flex-1 space-y-2">
						<Label htmlFor="member-email">Add member</Label>
						<Input
							id="member-email"
							type="email"
							placeholder="account@example.com"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							disabled={addMember.isPending}
							autoComplete="off"
						/>
					</div>
					<Button
						type="submit"
						disabled={!email.trim() || addMember.isPending}
						loading={addMember.isPending}
					>
						<UserPlusIcon className="size-4" />
						Add
					</Button>
				</form>

				{error ? (
					<ErrorState error={error} onRetry={() => void refetch()} />
				) : !data ? (
					<div className="flex justify-center py-8">
						<DotsRingLoading size={32} />
					</div>
				) : data.items.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No members yet.
					</p>
				) : (
					<ul className="divide-y">
						{data.items.map((member) => (
							<li
								key={member.id}
								className="flex items-center gap-3 py-2.5"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{member.name}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{member.email}
									</p>
								</div>
								<Select
									value={member.role}
									onValueChange={(role) =>
										changeRole.mutate({
											accountId: member.id,
											role: role as MemberRole,
										})
									}
								>
									<SelectTrigger
										className="h-8 w-28"
										aria-label={`Role of ${member.name}`}
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="owner">
											Owner
										</SelectItem>
										<SelectItem value="member">
											Member
										</SelectItem>
									</SelectContent>
								</Select>
								<Button
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-destructive"
									aria-label={`Remove ${member.name}`}
									disabled={removeMember.isPending}
									onClick={() =>
										removeMember.mutate(member.id)
									}
								>
									<UserMinusIcon className="size-4" />
								</Button>
							</li>
						))}
					</ul>
				)}
			</div>
		</Dialog>
	);
}
