import * as React from 'react';
import { useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { ChevronsUpDown, ShieldCheckIcon, UsersIcon } from 'lucide-react';
import {
	Sidebar,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { TitleBlock } from '@/components/data/TitleBlock';
import { useGlobal } from '@/hooks/useGlobal';
import { segmentAfter } from '@/libs/utils';
import { AdminWorkspaceSwitcher } from '@/components/layout/AdminWorkspaceSwitcher';
import { ShellSidebar } from '@/components/layout/ShellSidebar';

// The workspace card + nav of the entered workspace — /admin/workspaces/:slug/*
// only (routes/admin picks this sidebar by path). Permission is a planned
// sibling of Member (placeholder until the route exists).
export function AdminWorkspaceSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const { workspace } = useGlobal();
	const { pathname } = useLocation();
	// The slug rides in the URL — read it straight from the path so nav works
	// before the detail fetch lands.
	const slug = segmentAfter(pathname, '/admin/workspaces/') ?? '';
	const [switcherOpen, setSwitcherOpen] = useState(false);

	return (
		<ShellSidebar
			{...props}
			back={{ to: '/admin/workspaces', label: 'Back to admin' }}
			context={
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
			}
			groups={[
				{
					items: [
						{
							title: 'Member',
							to: '/admin/workspaces/$slug/member',
							params: { slug },
							icon: UsersIcon,
						},
						{ title: 'Permission', icon: ShieldCheckIcon },
					],
				},
			]}
		/>
	);
}
