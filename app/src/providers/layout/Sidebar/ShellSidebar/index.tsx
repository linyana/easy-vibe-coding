import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import type { FileRoutesByTo } from '@/routeTree.gen';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from '@/components/ui/sidebar';
import { NavGroup, type NavItem } from '../NavGroup';
import { NavAccount } from '../Account';

// One nav group in the shell: the route list + where it sits. `at: 'bottom'`
// pins the group to the footer edge (mt-auto) — secondary nav like
// Settings/Get Help. Groups render in array order.
export type ShellGroup = {
	label?: string;
	items: NavItem[];
	at?: 'top' | 'bottom';
};

// The hub-return header row — entered-workspace surfaces (app / admin
// workspace) point back to the context-free shell that launched them.
export type ShellBackLink = {
	to: keyof FileRoutesByTo;
	label: string;
};

// The one sidebar chrome, shared by every surface (app / admin / admin
// workspace / profile). Surfaces only supply what differs: a custom header, a
// back link (entered-workspace modes — replaces the brand header), the
// workspace selector row (a React node — surfaces without one omit it), and
// the nav groups. Route vocab lives at the surface, never here.
export function ShellSidebar({
	header,
	back,
	context,
	groups,
	...props
}: {
	header?: React.ReactNode;
	back?: ShellBackLink;
	/** The workspace selector row — render null/omit when the surface has none. */
	context?: React.ReactNode;
	groups: ShellGroup[];
} & React.ComponentProps<typeof Sidebar>) {
	const top = groups.filter((group) => group.at !== 'bottom');
	const bottom = groups.filter((group) => group.at === 'bottom');

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			{(header || back || context) && (
				<SidebarHeader>
					{header ?? (back && <BackToHubLink {...back} />)}
					{context}
				</SidebarHeader>
			)}
			<SidebarContent>
				{top.map((group, index) => (
					<NavGroup
						key={group.label ?? index}
						label={group.label}
						items={group.items}
					/>
				))}
				{bottom.map((group, index) => (
					<NavGroup
						key={group.label ?? index}
						// Only the first bottom group pulls away from the top
						// groups; the rest stack right under it.
						className={index === 0 ? 'mt-auto' : undefined}
						label={group.label}
						items={group.items}
					/>
				))}
			</SidebarContent>
			<SidebarFooter>
				<SidebarSeparator className="scale-y-50" />
				<NavAccount />
			</SidebarFooter>
		</Sidebar>
	);
}

function BackToHubLink({ to, label }: ShellBackLink) {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton asChild>
					<Link to={to}>
						<ArrowLeftIcon className="size-4" />
						<span>{label}</span>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
