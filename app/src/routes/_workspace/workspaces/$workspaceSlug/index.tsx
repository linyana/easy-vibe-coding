// The param `workspaceSlug` is the workspace's stable public identifier —
// used as-is in API paths (no coercion needed).
import { createFileRoute } from '@tanstack/react-router';
import { WorkspacesDashboard } from '@/pages';

export const Route = createFileRoute('/_workspace/workspaces/$workspaceSlug/')({
	component: WorkspacesDashboard,
});
