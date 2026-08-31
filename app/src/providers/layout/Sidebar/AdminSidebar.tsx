import * as React from 'react';
import { useState } from 'react';
import {
	ArrowLeftIcon,
	Building2Icon,
	ChevronsUpDown,
	LayoutDashboardIcon,
	ShieldCheckIcon,
	UsersIcon,
} from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from '@/components/ui/sidebar';
import { NavGroup, type NavItem } from './NavGroup';
import { NavAccount } from './Account';
import { Banner } from './Banner';
import { Header } from '@/components/data/Header';
import { Link, useLocation } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';
import { AdminWorkspaceSwitcher } from './AdminWorkspaceSwitcher';

// The admin surface's nav — platform-level, mirrors the app sidebar chrome
// (Banner / NavGroup / account footer). `to` values are route-tree checked.
// There is no in-UI admin↔app switcher: the admin surface is reached by URL
// (/admin) and the regular app by URL (`/`).
const navMain: NavItem[] = [
	{ title: 'Overview', to: '/admin', icon: LayoutDashboardIcon },
	{ title: 'Accounts', to: '/admin/accounts', icon: UsersIcon },
	{ title: 'Workspaces', to: '/admin/workspaces', icon: Building2Icon },
];

// The entered workspace's sections — Permission is a planned sibling of Member
// (placeholder until the route exists).
const navWorkspace: NavItem[] = [
	{ title: 'Member', to: '/admin/workspace/member', icon: UsersIcon },
	{ title: 'Permission', icon: ShieldCheckIcon },
];

// The sidebar switches modes by path (mirroring the reference admin): global
// platform nav vs the entered workspace's sections.
const isWorkspacePath = (pathname: string) =>
	pathname === '/admin/workspace' || pathname.startsWith('/admin/workspace/');

export function AdminSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const { workspace } = useGlobal();
	const location = useLocation();
	const [switcherOpen, setSwitcherOpen] = useState(false);
	const workspaceMode = isWorkspacePath(location.pathname);

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			{workspaceMode ? (
				// Workspace mode — the entered workspace's sections only. The
				// header leads back to the platform list (the entry gate); the
				// workspace card opens the quick hop switcher.
				<>
					<SidebarHeader>
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
						<div className="border rounded-lg">
							<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									size="lg"
									tooltip="Switch workspace"
									onClick={() => setSwitcherOpen(true)}
									className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<Header
										variant="profile"
										title={workspace?.name ?? 'Workspace'}
										description={workspace?.slug}
									/>
									<ChevronsUpDown className="ml-auto size-4" />
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
						</div>
					</SidebarHeader>
					<SidebarContent>
						<NavGroup items={navWorkspace} />
					</SidebarContent>
				</>
			) : (
				// Global mode — the platform surface. The context row is
				// static (no switcher): admin is never workspace-scoped by
				// default; workspaces are entered from the platform list.
				<>
					<SidebarHeader>
						<Banner />
					</SidebarHeader>
					<SidebarContent>
						<NavGroup label="Admin" items={navMain} />
					</SidebarContent>
				</>
			)}
			<SidebarFooter>
				<SidebarSeparator className="scale-y-50" />
				<NavAccount />
			</SidebarFooter>
			<AdminWorkspaceSwitcher
				open={switcherOpen}
				onOpenChange={setSwitcherOpen}
			/>
		</Sidebar>
	);
}
