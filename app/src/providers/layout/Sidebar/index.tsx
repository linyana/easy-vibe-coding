import * as React from 'react';
import { useState } from 'react';
import {
	ChartBar,
	ChevronsUpDown,
	Database,
	FileChartLine,
	Folder,
	HelpCircle,
	ListTodo,
	Search,
	Settings,
	Users,
} from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Header } from '@/components/data/Header';
import { NavGroup, type NavItem } from './NavGroup';
import { NavAccount } from './Account';
import { Banner } from './Banner';
import { useGlobal } from '@/hooks/useGlobal';
import { SwitchWorkspaceDialog } from '@/providers/workspace/SwitchWorkspaceDialog';

// Nav 词汇表。`to` 由生成的 route tree 类型校验（FileRoutesByTo）：nav 只能指向
// 真实存在的路由。`to` 缺省 = 占位项（页面还没建），渲染为禁用的占位按钮；
// 页面建好后补上 `to` 即变真链接——路径写错会在 `bun run check` 直接报错。
const navMain: NavItem[] = [
	{ title: 'Members', to: '/members', icon: Users },
	// 预留（页面还没建）：
	{ title: 'Lifecycle', icon: ListTodo },
	{ title: 'Analytics', icon: ChartBar },
	{ title: 'Projects', icon: Folder },
];

const navDocuments: NavItem[] = [
	// 预留（页面还没建）：
	{ title: 'Data Library', icon: Database },
	{ title: 'Reports', icon: FileChartLine },
];

const navSecondary: NavItem[] = [
	// 预留（页面还没建）：
	{ title: 'Settings', icon: Settings },
	{ title: 'Get Help', icon: HelpCircle },
	{ title: 'Search', icon: Search },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { workspace } = useGlobal();
	const [switcherOpen, setSwitcherOpen] = useState(false);

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<Banner />
				{/* The workspace switcher — the nav's context entry point. Only
					renders in the app sidebar: the admin surface is platform-level
					and deliberately outside any workspace context. */}
				{workspace && (
					<>
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
										title={workspace.name}
										description={workspace.slug}
									/>
									<ChevronsUpDown className="ml-auto size-4" />
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
						<SwitchWorkspaceDialog
							open={switcherOpen}
							onOpenChange={setSwitcherOpen}
						/>
					</>
				)}
			</SidebarHeader>
			<SidebarContent>
				<NavGroup items={navMain} />
				<NavGroup label="Documents" items={navDocuments} />
				<NavGroup className="mt-auto" items={navSecondary} />
			</SidebarContent>
			<SidebarFooter>
				<NavAccount />
			</SidebarFooter>
		</Sidebar>
	);
}
