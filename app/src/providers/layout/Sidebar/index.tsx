import * as React from 'react';
import { useState } from 'react';
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
import { WorkspaceSelect } from '@/providers/workspace/Select';
import { Dialog } from '@/components';
import { ShellSidebar } from './ShellSidebar';

// The workspace surface's context row — the workspace switcher. Renders only
// with an active workspace; the profile shell's picker is the other
// workspace-selection surface.
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

// The workspace app surface — entered from the profile shell's picker. The
// header leads back there (the entry gate), mirroring admin's workspace-mode
// sidebar; the context row switches workspace without leaving the app.
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
							to: '/members',
							icon: Users,
						},
						{
							title: 'Connections',
							icon: PlugZap,
							// Expandable second level (SubMenu) — ai-lab style: the
							// parent toggles the platform pages.
							children: [
								{
									title: 'Shopify',
									to: '/connections/shopify',
									icon: ShoppingBag,
								},
								{
									title: 'BigCommerce',
									to: '/connections/bigcommerce',
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
