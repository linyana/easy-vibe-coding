import * as React from 'react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from '@/components/ui/sidebar';
import { NavGroup } from './NavGroup';
import type { NavGroupConfig } from '../nav';

export type { NavGroupConfig } from '../nav';
import { NavUser } from './User';
import { Banner } from './Banner';
import { useGlobal } from '@/hooks/useGlobal';

// The shell sidebar — nav groups are supplied by the shell (personal vs
// workspace, see providers/layout/nav.ts). Admin-only items are filtered out
// for regular users, and empty groups are dropped entirely.
export function AppSidebar({
	navGroups,
	...props
}: React.ComponentProps<typeof Sidebar> & { navGroups: NavGroupConfig[] }) {
	const isAdmin = useGlobal((s) => s.auth.user?.isAdmin ?? false);
	const groups = navGroups
		.map((group) => ({
			...group,
			items: group.items.filter((item) => !item.adminOnly || isAdmin),
		}))
		.filter((group) => group.items.length > 0);

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<Banner />
			</SidebarHeader>
			<SidebarContent>
				{groups.map((group, index) => (
					<NavGroup
						key={group.label ?? index}
						label={group.label}
						items={group.items}
						className={group.className}
					/>
				))}
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
