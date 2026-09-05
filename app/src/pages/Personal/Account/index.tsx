import { useGlobal } from '@/hooks/useGlobal';
import { usePageHeader } from '@/hooks';
import { Card } from '@/components';
import { AccountIdentity } from './Identity';

// The personal home — the account's identity card (shared with the Settings
// dialog's Profile tab — see AccountIdentity).
export function PersonalAccountPage() {
	const { workspace } = useGlobal();

	usePageHeader({
		title: 'Account',
		description: 'Who you are signed in as.',
		// With an entered workspace, the header arrow returns to the workspace
		// app — the personal sidebar holds no workspace-surface links.
		back: workspace ? { to: '/', label: 'Back to workspace' } : undefined,
	});

	return (
		<div className="space-y-4">
			<Card title="Account" description="Your sign-in identity.">
				<AccountIdentity />
			</Card>
		</div>
	);
}
