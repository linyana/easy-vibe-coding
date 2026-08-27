import { Link } from '@tanstack/react-router';
import type { FileRoutesByTo } from '@/routeTree.gen';
import { type LucideIcon } from 'lucide-react';

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

export type NavItem = {
	title: string;
	to?: keyof FileRoutesByTo;
	icon?: LucideIcon;
	/** Only shown to platform admins (isAdmin on the session user). */
	adminOnly?: boolean;
};

export function NavGroup({
	label,
	items,
	className,
}: {
	label?: string;
	items: NavItem[];
	className?: string;
}) {
	return (
		<SidebarGroup className={className}>
			{label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) =>
						item.to ? (
							<SidebarMenuItem key={item.to}>
								<SidebarMenuButton asChild tooltip={item.title}>
									<Link
										to={item.to}
										// 首页索引路由精确匹配；其他路由按路径前缀匹配，
										// 未来加子路由（/users/:id）时父条目仍保持高亮。
										activeOptions={{
											exact: item.to === '/',
											includeSearch: false,
										}}
										// Link 自带 aria-current="page"；data-active
										// 喂给 shadcn sidebar 的 active 样式。
										activeProps={{ 'data-active': true }}
									>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						) : (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton disabled>
									{item.icon && <item.icon />}
									<span>{item.title}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						),
					)}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
