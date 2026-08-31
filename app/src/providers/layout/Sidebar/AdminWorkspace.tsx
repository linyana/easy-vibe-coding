import * as React from 'react';
import { useState } from 'react';
import {
	ArrowLeftIcon,
	ChevronsUpDown,
	ShieldCheckIcon,
	UsersIcon,
} from 'lucide-react';
import {
	Sidebar,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from './NavGroup';
import { TitleBlock } from '@/components/data/TitleBlock';
import { Link } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';
import { AdminWorkspaceSwitcher } from './AdminWorkspaceSwitcher';
import { ShellSidebar } from './ShellSidebar';

// The entered workspace's sections — Permission is a planned sibling of Member
// (placeholder until the route exists).
const navWorkspace: NavItem[] = [
	{ title: 'Member', to: '/admin/workspace/member', icon: UsersIcon },
	{ title: 'Permission', icon: ShieldCheckIcon },
];

// The surface's context row — the workspace card. Opens the quick-hop
// switcher (re-scopes without leaving the page); the header leads back to the
// platform list (the entry gate).
function WorkspaceCard() {
	const { workspace } = useGlobal();
	const [switcherOpen, setSwitcherOpen] = useState(false);

	return (
		<div className="border border-gray-500/10 rounded-lg">
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						tooltip="Switch workspace"
						onClick={() => setSwitcherOpen(true)}
						className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<TitleBlock
							variant="profile"
							title={workspace?.name ?? 'Workspace'}
							description={workspace?.slug}
						/>
						<ChevronsUpDown className="ml-auto size-4" />
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
			<AdminWorkspaceSwitcher
				open={switcherOpen}
				onOpenChange={setSwitcherOpen}
			/>
		</div>
	);
}

// The entered workspace's surface — nav for /admin/workspace/* only. The
// platform surface is AdminSidebar; routes/admin picks by path.
export function AdminWorkspaceSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<ShellSidebar
			{...props}
			header={
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link to="/admin/workspaces">
								<ArrowLeftIcon className="size-4" />
								<span>Back to admin</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			}
			context={<WorkspaceCard />}
			groups={[{ items: navWorkspace }]}
		/>
	);
}
