import { useGlobal } from '@/hooks/useGlobal';
import { usePageHeader } from '@/hooks';
import { Card } from '@/components';
import { WorkspaceSelect } from '@/providers/workspace/Select';

// The profile's workspace selection — the picker the no-workspace gate and the
// app sidebar hand off to. Choosing a workspace opens it in a NEW TAB (the URL
// is the address, no session exchange) and leaves this page open — pick the
// next one, or stay here as the hub.
export function ProfileWorkspacesPage() {
	const { workspace } = useGlobal();

	usePageHeader({
		title: 'Workspaces',
		description:
			'Pick one of your workspaces to open in a new tab, or create a new one.',
		// With an open workspace the current row is marked — the header arrow
		// is the way back into that workspace.
		back: workspace ? { to: '/', label: 'Back to workspace' } : undefined,
	});

	return (
		<div className="space-y-4">
			<Card>
				<WorkspaceSelect active headerVariant="default" newTab />
			</Card>
		</div>
	);
}
