import { useNavigate } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';
import { usePageHeader } from '@/hooks';
import { Card } from '@/components';
import { WorkspaceSelect } from '@/providers/workspace/Select';

// The profile's workspace selection — the picker the no-workspace gate now
// hands off to (previously a bare full-screen card). Choosing a workspace
// exchanges the session token, then leaves the context-free profile shell
// for the workspace app — the enter flow mirrors admin's.
export function ProfileWorkspacesPage() {
	const navigate = useNavigate();
	const { workspace } = useGlobal();

	usePageHeader({
		title: 'Workspaces',
		description:
			'Pick one of your workspaces to enter, or create a new one.',
		// With an entered workspace the current row is marked, not selectable —
		// the header arrow is the way back into the workspace app.
		back: workspace ? { to: '/', label: 'Back to workspace' } : undefined,
	});

	return (
		<div className="space-y-4">
			<Card>
				<WorkspaceSelect
					active
					headerVariant="default"
					onSwitched={() => void navigate({ to: '/' })}
				/>
			</Card>
		</div>
	);
}
