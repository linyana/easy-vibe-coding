import {
	ChartBar,
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
import type { NavItem } from './Sidebar/NavGroup';

// Nav 词汇表。`to` 由生成的 route tree 类型校验（FileRoutesByTo）：nav 只能指向
// 真实存在的路由。`to` 缺省 = 占位项（页面还没建），渲染为禁用的占位按钮；
// 页面建好后补上 `to` 即变真链接——路径写错会在 `bun run check` 直接报错。

export type NavGroupConfig = {
	label?: string;
	items: NavItem[];
	className?: string;
};

// Personal shell — the signed-in user's own surface: their workspace list
// (the picker) and the admin global pages. No workspace switcher here —
// switching happens inside a workspace.
export const personalNavGroups: NavGroupConfig[] = [
	{
		items: [
			{ title: 'Workspaces', to: '/workspaces', icon: LayoutDashboard },
			{
				title: 'Users',
				to: '/users',
				icon: Users,
				// Global account management is the platform admin surface.
				adminOnly: true,
			},
		],
	},
	// 预留（页面还没建）：
	{
		label: 'Documents',
		items: [
			{ title: 'Data Library', icon: Database },
			{ title: 'Reports', icon: FileChartLine },
		],
	},
	{
		className: 'mt-auto',
		items: [
			{ title: 'Settings', icon: Settings },
			{ title: 'Get Help', icon: HelpCircle },
			{ title: 'Search', icon: Search },
		],
	},
];

// Workspace shell — everything inside one workspace: its dashboard, members,
// and future business modules. Links are built from the current slug; a null
// slug (never picked) degrades the group to disabled placeholders.
export const workspaceNavGroups = (
	currentWorkspaceId: string | null,
): NavGroupConfig[] => {
	const scoped = (to: string) =>
		currentWorkspaceId
			? `/workspaces/${currentWorkspaceId}${to}`
			: undefined;
	return [
		{
			items: [
				{
					title: 'Dashboard',
					to: scoped('') as '/workspaces/$workspaceSlug',
					icon: LayoutDashboard,
				},
				{
					title: 'Members',
					to: scoped(
						'/members',
					) as '/workspaces/$workspaceSlug/members',
					icon: Users,
				},
				// 预留（页面还没建）：
				{ title: 'Projects', icon: Folder },
				{ title: 'Team', icon: Users },
				{ title: 'Analytics', icon: ChartBar },
				{ title: 'Lifecycle', icon: ListTodo },
			],
		},
		// 预留（页面还没建）：
		{
			label: 'Documents',
			items: [
				{ title: 'Data Library', icon: Database },
				{ title: 'Reports', icon: FileChartLine },
			],
		},
		{
			className: 'mt-auto',
			items: [
				{ title: 'Settings', icon: Settings },
				{ title: 'Get Help', icon: HelpCircle },
				{ title: 'Search', icon: Search },
			],
		},
	];
};
