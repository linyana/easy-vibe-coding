import { Building2Icon, CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useGlobal } from '@/hooks/useGlobal';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// The current-workspace selector — lives in the app bar so switching is
// always one click away. Selecting navigates into that workspace (its home
// page); the query is a lightweight "my workspaces" fetch (pageSize covers
// the whole list). Workspace-scoped pages key off the chosen slug in their
// own query keys.
export function WorkspaceSwitcher() {
	const navigate = useNavigate();
	const currentWorkspaceId = useGlobal((s) => s.currentWorkspaceId);
	const setCurrentWorkspaceId = useGlobal(
		(s) => s.actions.setCurrentWorkspaceId,
	);
	const { data } = useAPIQuery({
		queryKey: ['workspaces', 'switcher'],
		queryFn: () =>
			API.workspaces.get({ query: { page: 1, pageSize: 100 } }),
		toastError: false,
	});

	const workspaces = data?.items ?? [];
	const current = workspaces.find((w) => w.slug === currentWorkspaceId);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-1.5">
					<Building2Icon className="size-4 shrink-0" />
					<span className="max-w-32 truncate">
						{current?.name ?? 'Select workspace'}
					</span>
					<ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60">
				<DropdownMenuLabel>Workspaces</DropdownMenuLabel>
				{workspaces.length === 0 ? (
					<DropdownMenuItem disabled>
						No workspaces yet — create one
					</DropdownMenuItem>
				) : (
					workspaces.map((workspace) => (
						<DropdownMenuItem
							key={workspace.slug}
							onSelect={() => {
								setCurrentWorkspaceId(workspace.slug);
								void navigate({
									to: '/workspaces/$workspaceSlug',
									params: {
										workspaceSlug: workspace.slug,
									},
								});
							}}
						>
							<span className="flex-1 truncate">
								{workspace.name}
							</span>
							{workspace.slug === currentWorkspaceId && (
								<CheckIcon className="size-4" />
							)}
						</DropdownMenuItem>
					))
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to="/workspaces" className="gap-2">
						<Building2Icon className="size-4" />
						All workspaces
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
