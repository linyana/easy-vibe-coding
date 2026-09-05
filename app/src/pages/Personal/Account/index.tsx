import { useGlobal } from '@/hooks/useGlobal';
import { usePageHeader } from '@/hooks';
import { Card } from '@/components';

// The personal home — the account's identity, read from the session store
// (booted from /auth/me), so no request of its own. Future editable fields
// (name, password, …) replace the read-only rows, not the surface.
export function PersonalAccountPage() {
	const { account, workspace } = useGlobal();
	const displayName = account?.name ?? 'Signed in';
	const displayEmail = account?.email ?? '—';

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
				<div className="flex items-center gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
						{displayName.slice(0, 1).toUpperCase()}
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<p className="truncate text-sm font-medium">
								{displayName}
							</p>
							{account?.isAdmin && (
								<span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
									Admin
								</span>
							)}
						</div>
						<p className="truncate text-xs text-muted-foreground">
							{displayEmail}
						</p>
					</div>
				</div>
			</Card>
		</div>
	);
}
