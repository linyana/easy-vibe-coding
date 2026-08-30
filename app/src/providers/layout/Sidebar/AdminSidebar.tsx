import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
	Building2Icon,
	ChevronsUpDown,
	LayoutDashboardIcon,
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
import { WorkspaceSelect } from '@/providers/workspace/Select';
import { Dialog } from '@/components';

// The admin surface's nav — platform-level, mirrors the app sidebar chrome
// (Banner / NavGroup / account footer). `to` values are route-tree checked.
const navMain: NavItem[] = [
	{ title: 'Overview', to: '/admin', icon: LayoutDashboardIcon },
	{ title: 'Accounts', to: '/admin/accounts', icon: UsersIcon },
	{ title: 'Workspaces', to: '/admin/workspaces', icon: Building2Icon },
];

export function AdminSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const navigate = useNavigate();
	const [switcherOpen, setSwitcherOpen] = useState(false);

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<Banner />
				{/* The context switcher — the platform-level counterpart of the
					app sidebar's workspace switcher. Admin is never
					workspace-scoped, so the current context is always "Admin";
					the dialog skips the admin landing (initialView="list") and
					picking a workspace is the way back into the app. */}
				<SidebarSeparator className="scale-y-50" />
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							tooltip="Switch context"
							onClick={() => setSwitcherOpen(true)}
							className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Header
								variant="profile"
								title="Admin"
								description="Platform level"
							/>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				<Dialog
					open={switcherOpen}
					onOpenChange={setSwitcherOpen}
					contentClassName="sm:w-3/5 sm:max-w-none"
				>
					<WorkspaceSelect
						headerVariant="default"
						active={switcherOpen}
						initialView="list"
						onSwitched={() => {
							setSwitcherOpen(false);
							void navigate({ to: '/' });
						}}
					/>
				</Dialog>
			</SidebarHeader>
			<SidebarContent>
				<NavGroup label="Admin" items={navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavAccount />
			</SidebarFooter>
		</Sidebar>
	);
}
