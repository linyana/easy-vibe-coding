import type { ReactNode } from 'react';
import { Navigate } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';

// Gate, not a route: an authenticated session without a workspace has no
// workspace context, so the workspace surfaces (/_app/*) can't render. The
// personal shell (/profile) is context-free and hosts the workspace picker —
// the gate hands off there instead of showing a bare full-screen card.
export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const { workspace } = useGlobal();
	if (workspace == null) return <Navigate to="/profile/workspaces" replace />;
	return <>{children}</>;
}
