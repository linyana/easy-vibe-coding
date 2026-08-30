import * as React from 'react';
import {
	ArrowLeftIcon,
	Building2Icon,
	LayoutDashboardIcon,
	UsersIcon,
} from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from '@/components/ui/sidebar';
import { NavGroup, type NavItem } from './NavGroup';
import { NavAccount } from './Account';
import { Banner } from './Banner';

// The admin surface's nav — platform-level, mirrors the app sidebar chrome
// (Banner / NavGroup / account footer). `to` values are route-tree checked.
const navMain: NavItem[] = [
	{ title: 'Overview', to: '/admin', icon: LayoutDashboardIcon },
	{ title: 'Accounts', to: '/admin/accounts', icon: UsersIcon },
	{ title: 'Workspaces', to: '/admin/workspaces', icon: Building2Icon },
];

const navSecondary: NavItem[] = [
	// Back to user mode — lands on the workspace picker (or the current
	// workspace if one is active).
	{ title: 'Back to app', to: '/', icon: ArrowLeftIcon },
];

export function AdminSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<Banner />
			</SidebarHeader>
			<SidebarContent>
				<NavGroup label="Admin" items={navMain} />
				<NavGroup className="mt-auto" items={navSecondary} />
			</SidebarContent>
			<SidebarFooter>
				<NavAccount />
			</SidebarFooter>
		</Sidebar>
	);
}
