import { useCallback, useState } from 'react';
import type { LlmProvidersAction } from './types';
import { LlmProviderList } from './List';
import { CreateLlmProviderDialog } from './Create';
import { EditLlmProviderDialog } from './Edit';
import { DeleteLlmProviderDialog } from './Delete';

// The LLM providers surface — mounted on the profile shell's /profile/llm
// page: the List owns the data surface; this orchestrator only decides which
// dialog is open and for which provider (Edit/Delete remount per row via
// key).
export function LlmProvidersSettings() {
	const [action, setAction] = useState<LlmProvidersAction | null>(null);
	const [open, setOpen] = useState(false);

	const handleAction = useCallback((action: LlmProvidersAction) => {
		setAction(action);
		setOpen(true);
	}, []);

	const handleOpenChange = useCallback((open: boolean) => setOpen(open), []);

	return (
		<>
			<LlmProviderList onAction={handleAction} />
			{action?.kind === 'create' && (
				<CreateLlmProviderDialog
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'edit' && (
				<EditLlmProviderDialog
					key={action.provider.id}
					provider={action.provider}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'delete' && (
				<DeleteLlmProviderDialog
					key={action.provider.id}
					provider={action.provider}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</>
	);
}
