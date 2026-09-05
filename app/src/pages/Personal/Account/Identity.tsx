import { useGlobal } from '@/hooks/useGlobal';

// Who is signed in — avatar, name (plus the admin badge) and email, straight
// from the session store (booted from /auth/me), so no request of its own.
// The /personal Account page and the Settings dialog's Profile tab render the
// same row; future editable fields (name, password, …) live behind this row,
// not next to it.
export function AccountIdentity() {
	const { account } = useGlobal();
	const displayName = account?.name ?? 'Signed in';
	const displayEmail = account?.email ?? '—';

	return (
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
	);
}
