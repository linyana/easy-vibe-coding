import { useState } from 'react';
import { Bot, User } from 'lucide-react';
import { Dialog } from '@/components';
import { cn } from '@/libs/utils';
import { useGlobal } from '@/hooks/useGlobal';
import { LlmProvidersSettings } from '@/pages/LLM';

type SectionId = 'account' | 'llm';

const SECTIONS: { id: SectionId; label: string; icon: typeof User }[] = [
	{ id: 'account', label: 'Account', icon: User },
	{ id: 'llm', label: 'LLM providers', icon: Bot },
];

// Personal settings — a dialog with a left nav, mounted by the sidebar's
// profile menu (NavAccount) so every surface (app / admin / admin workspace)
// reaches it. Account-level, not workspace-level: the LLM providers live on
// the account and work regardless of the workspace context.
export function SettingsDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [section, setSection] = useState<SectionId>('account');

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			icon={{ name: 'Settings2' }}
			title="Personal settings"
			description="Account-level preferences, available from anywhere you're signed in."
			contentClassName="flex h-[80vh] flex-col sm:max-w-[960px]"
		>
			{/* The dialog body fills the fixed-height content: the left nav is a
				sibling column, the right pane is the one scroll region (content
				that outgrows the dialog scrolls internally, never the window). */}
			<div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row">
				<nav
					className="flex w-full shrink-0 flex-col gap-1 sm:w-[190px]"
					aria-label="Settings sections"
				>
					{SECTIONS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => setSection(id)}
							aria-current={section === id ? 'page' : undefined}
							className={cn(
								'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
								section === id
									? 'bg-accent text-accent-foreground'
									: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
							)}
						>
							<Icon className="size-4" />
							{label}
						</button>
					))}
				</nav>

				<div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
					{section === 'account' ? (
						<AccountSettings />
					) : (
						<LlmProvidersSettings />
					)}
				</div>
			</div>
		</Dialog>
	);
}

// Read-only identity section — the session store is the source (booted from
// /auth/me), no request needed. Future sections (name/password/…) replace
// the read-only rows, not the surface.
function AccountSettings() {
	const { account } = useGlobal();
	const displayName = account?.name ?? 'Signed in';
	const displayEmail = account?.email ?? '—';

	return (
		<div className="space-y-3">
			<div>
				<h3 className="text-sm font-semibold">Account</h3>
				<p className="mt-0.5 text-xs text-muted-foreground">
					Who you are signed in as.
				</p>
			</div>
			<div className="rounded-xl border bg-card p-4">
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
			</div>
		</div>
	);
}
