import { API } from '@/libs/api';
import { RemoveDialog } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import type { LlmProvider } from '../types';

export function DeleteLlmProviderDialog({
	provider,
	open,
	onOpenChange,
}: {
	provider: LlmProvider;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const mutation = useAPIMutation({
		call: () => API.llm({ id: provider.id }).delete(),
		queryKey: ['llm'],
		successMessage: 'Provider removed',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Remove provider"
			description={`Remove ${provider.name} (${provider.baseUrl}).`}
			confirmText={provider.name}
			mutation={mutation}
		>
			The stored key will be permanently deleted. If this provider is your
			default, the default model choice is cleared too — nothing else
			breaks. This action cannot be undone.
		</RemoveDialog>
	);
}
