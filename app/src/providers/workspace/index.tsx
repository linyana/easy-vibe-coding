import { useGlobal } from '@/hooks/useGlobal';
import { WorkspaceSelect } from './Select';

// Gate, not a route: an authenticated session without a workspace has no
// workspace context yet — the picker replaces the whole app until the token
// is exchanged for a workspace-scoped one. The switcher stays mounted for
// the gate's lifetime (active always), so it loads on entry.
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
	const { workspace } = useGlobal();
	if (workspace == null) return <WorkspacePicker />;
	return <>{children}</>;
}

function WorkspacePicker() {
	return (
		<div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
			<div className="w-full sm:w-3/5">
				<WorkspaceSelect active />
			</div>
		</div>
	);
}
