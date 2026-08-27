import { API } from '@/libs/api';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { TenantMember } from '../../types';

export function RemoveMemberDialog({
	tenantId,
	member,
	open,
	onOpenChange,
}: {
	tenantId: number;
	member: TenantMember;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const mutation = useAPIMutation({
		call: () =>
			API.tenants({ tenantId })
				.members({ userId: member.userId })
				.delete(),
		queryKey: ['tenants', tenantId, 'members'],
		successMessage: 'Member removed',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Remove member"
			confirmText={member.email}
			mutation={mutation}
		>
			{`${member.name} (${member.email}) will lose access to this tenant's data. This action cannot be undone.`}
		</RemoveDialog>
	);
}
