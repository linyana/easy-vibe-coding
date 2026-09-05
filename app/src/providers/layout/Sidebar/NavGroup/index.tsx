import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { FileRoutesByTo } from '@/routeTree.gen';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/libs/utils';

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export type NavItem = {
	title: string;
	to?: keyof FileRoutesByTo;
	/** Path params for a parameterized target (a workspace slug route) — the
	 *  surface that defines the item supplies them (from its own location). */
	params?: Record<string, string>;
	icon?: LucideIcon;
	/** Expandable second level (like the platform pages under Connections) —
	 *  the parent toggles open/closed, children are plain links. */
	children?: NavItem[];
};

// One collapsible sub-menu: the parent button toggles a chevron + the child
// list; active state rides each child Link's own prefix matching.
function SubMenu({ item }: { item: NavItem & { children: NavItem[] } }) {
	const [open, setOpen] = useState(false);
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				onClick={() => setOpen((value) => !value)}
				tooltip={item.title}
			>
				{item.icon && <item.icon />}
				<span>{item.title}</span>
				<ChevronDown
					className={cn(
						'ml-auto size-4 transition-transform',
						open && 'rotate-180',
					)}
				/>
			</SidebarMenuButton>
			{open && (
				<SidebarMenuSub>
					{item.children.map((child) =>
						child.to ? (
							<SidebarMenuSubItem key={child.to}>
								<SidebarMenuSubButton asChild>
									<Link
										to={child.to}
										params={child.params}
										activeOptions={{ includeSearch: false }}
										activeProps={{ 'data-active': true }}
									>
										{child.icon && <child.icon />}
										<span>{child.title}</span>
									</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						) : null,
					)}
				</SidebarMenuSub>
			)}
		</SidebarMenuItem>
	);
}

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
						item.children?.length ? (
							<SubMenu
								key={item.title}
								item={item as NavItem & { children: NavItem[] }}
							/>
						) : item.to ? (
							<SidebarMenuItem key={item.to}>
								<SidebarMenuButton asChild tooltip={item.title}>
									<Link
										to={item.to}
										params={item.params}
										// 索引页（/、/admin、/profile）精确匹配：/admin 的兄弟页
										// （Accounts/Workspaces）是并列页不是子页，前缀匹配
										// 会让 Overview 一直高亮；其余条目按路径前缀匹配，
										// 未来加子路由（/accounts/:id）时父条目仍保持高亮。
										activeOptions={{
											exact:
												item.to === '/' ||
												item.to === '/admin' ||
												item.to === '/profile',
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
