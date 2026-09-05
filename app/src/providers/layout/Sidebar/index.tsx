import * as React from 'react';
import { useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import {
	ChevronsUpDown,
	PlugZap,
	ShoppingBag,
	Store,
	Users,
} from 'lucide-react';
import {
	Sidebar,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { TitleBlock } from '@/components/data/TitleBlock';
import { useGlobal } from '@/hooks/useGlobal';
import { segmentAfter } from '@/libs/utils';
import { WorkspaceSelect } from '@/providers/workspace/Select';
import { Dialog } from '@/components';
import { ShellSidebar } from './ShellSidebar';

// The workspace surface's context row — the workspace switcher. The URL slug
// is the address, so the row just opens the picker (which navigates); the
// header leads back to the picker that launched the app.
function WorkspaceSwitcher() {
	const { workspace } = useGlobal();
	const [switcherOpen, setSwitcherOpen] = useState(false);

	if (!workspace) return null;

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
							title={workspace.name}
							description={workspace.slug}
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
					onSwitched={() => setSwitcherOpen(false)}
				/>
			</Dialog>
		</div>
	);
}

// The workspace app surface — nav targets are slug-parameterized routes; the
// current slug comes from the pathname (the sidebar only renders under
// /workspaces/:slug/*), so links stay valid even before the workspace's
// detail fetch lands.
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { pathname } = useLocation();
	const slug = segmentAfter(pathname, '/workspaces/') ?? '';

	return (
		<ShellSidebar
			{...props}
			back={{ to: '/profile/workspaces', label: 'Back to profile' }}
			context={<WorkspaceSwitcher />}
			groups={[
				{
					// One group — Members and the Connections submenu sit flush
					// (a second group would add its own p-2 padding between them).
					items: [
						{
							title: 'Members',
							to: '/workspaces/$slug/members',
							params: { slug },
							icon: Users,
						},
						{
							title: 'Connections',
							icon: PlugZap,
							// Expandable second level (SubMenu) — the parent
							// toggles the platform pages.
							children: [
								{
									title: 'Shopify',
									to: '/workspaces/$slug/connections/shopify',
									params: { slug },
									icon: ShoppingBag,
								},
								{
									title: 'BigCommerce',
									to: '/workspaces/$slug/connections/bigcommerce',
									params: { slug },
									icon: Store,
								},
							],
						},
					],
				},
			]}
		/>
	);
}
