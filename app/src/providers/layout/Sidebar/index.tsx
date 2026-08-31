import * as React from 'react';
import { useState } from 'react';
import { ChevronsUpDown, Users } from 'lucide-react';
import {
	Sidebar,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { TitleBlock } from '@/components/data/TitleBlock';
import { Banner } from './Banner';
import { useGlobal } from '@/hooks/useGlobal';
import { WorkspaceSelect } from '@/providers/workspace/Select';
import { Dialog } from '@/components';
import { ShellSidebar } from './ShellSidebar';

// The app surface's context row — the workspace switcher. Renders only with
// an active workspace; the admin shell has its own platform-level switcher.
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

// The app surface — workspace-scoped user nav. Route lists live here; the
// shell owns the chrome (header / context / footer / group positions).
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<ShellSidebar
			{...props}
			header={<Banner />}
			context={<WorkspaceSwitcher />}
			groups={[
				{
					items: [{ title: 'Members', to: '/members', icon: Users }],
				},
			]}
		/>
	);
}
