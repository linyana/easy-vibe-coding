import * as React from 'react';
import {
	Building2Icon,
	LayoutDashboardIcon,
	SettingsIcon,
	UsersIcon,
} from 'lucide-react';
import { Sidebar } from '@/components/ui/sidebar';
import { Banner } from './Banner';
import { ShellSidebar } from './ShellSidebar';

// The admin platform surface — global nav. The entered-workspace surface is a
// separate component (AdminWorkspaceSidebar); routes/admin picks by path.
export function AdminSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<ShellSidebar
			{...props}
			header={<Banner />}
			groups={[
				{
					label: 'Admin',
					items: [
						{
							title: 'Overview',
							to: '/admin',
							icon: LayoutDashboardIcon,
						},
						{
							title: 'Workspaces',
							to: '/admin/workspaces',
							icon: Building2Icon,
						},
						{
							title: 'Accounts',
							to: '/admin/accounts',
							icon: UsersIcon,
						},
					],
				},
				{
					at: 'bottom',
					items: [
						{
							title: 'Settings',
							to: '/admin/settings',
							icon: SettingsIcon,
						},
					],
				},
			]}
		/>
	);
}
