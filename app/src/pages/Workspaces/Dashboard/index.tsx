import { useParams } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { usePageHeader } from '@/hooks';
import { Card, ErrorState } from '@/components';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/libs/dates';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="mt-1 font-medium">{value}</dd>
		</div>
	);
}

// The workspace home — its overview today, business modules (projects,
// orders, …) will mount here as the AI builds them.
export function WorkspacesDashboard() {
	const { workspaceSlug } = useParams({
		from: '/_workspace/workspaces/$workspaceSlug',
	});

	const query = useAPIQuery({
		queryKey: ['workspaces', 'detail', workspaceSlug],
		queryFn: () => API.workspaces({ workspaceSlug }).get(),
		toastError: false,
	});

	const { data: workspace, error, refetch } = query;

	usePageHeader({
		title: workspace?.name ?? 'Workspace',
		back: { to: '/workspaces', label: 'All workspaces' },
	});

	return (
		<div className="space-y-4">
			{error ? (
				<ErrorState error={error} onRetry={() => void refetch()} />
			) : (
				<Card title="Dashboard">
					{workspace ? (
						<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field label="Slug" value={workspace.slug} />
							<Field label="Name" value={workspace.name} />
							<Field
								label="Your role"
								value={
									workspace.role === 'owner' ? (
										<Badge>Owner</Badge>
									) : workspace.role === 'member' ? (
										<Badge variant="secondary">
											Member
										</Badge>
									) : (
										<span className="text-muted-foreground">
											—
										</span>
									)
								}
							/>
							<Field
								label="Created"
								value={formatDateTime(workspace.createdAt)}
							/>
						</dl>
					) : null}
				</Card>
			)}
		</div>
	);
}
