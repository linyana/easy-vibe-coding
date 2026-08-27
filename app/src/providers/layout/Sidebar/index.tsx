import * as React from 'react';
import {
	ChartBar,
	Building2,
	Database,
	FileChartLine,
	Folder,
	HelpCircle,
	LayoutDashboard,
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
} from '@/components/ui/sidebar';
import { NavGroup, type NavItem } from './NavGroup';
import { NavUser } from './User';
import { Banner } from './Banner';
import { useGlobal } from '@/hooks/useGlobal';

// Nav 词汇表。`to` 由生成的 route tree 类型校验（FileRoutesByTo）：nav 只能指向
// 真实存在的路由。`to` 缺省 = 占位项（页面还没建），渲染为禁用的占位按钮；
// 页面建好后补上 `to` 即变真链接——路径写错会在 `bun run check` 直接报错。
const navMain: NavItem[] = [
	{ title: 'Dashboard', to: '/', icon: LayoutDashboard },
	{
		title: 'Users',
		to: '/users',
		icon: Users,
		// Global account management is the platform admin surface.
		adminOnly: true,
	},
	{ title: 'Tenants', to: '/tenants', icon: Building2 },
	// 预留（页面还没建）：
	{ title: 'Lifecycle', icon: ListTodo },
	{ title: 'Analytics', icon: ChartBar },
	{ title: 'Projects', icon: Folder },
	{ title: 'Team', icon: Users },
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
	const isAdmin = useGlobal((s) => s.auth.user?.isAdmin ?? false);
	// Global surfaces (Users) are admin-only — regular users see their own
	// tenants, never the platform's account list.
	const mainItems = navMain.filter((item) => !item.adminOnly || isAdmin);

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<Banner />
			</SidebarHeader>
			<SidebarContent>
				<NavGroup items={mainItems} />
				<NavGroup label="Documents" items={navDocuments} />
				<NavGroup className="mt-auto" items={navSecondary} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
