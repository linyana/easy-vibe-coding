import { LogOut, MoreVertical, ShieldCheckIcon, UserIcon } from 'lucide-react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { TitleBlock } from '@/components/data/TitleBlock';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';
import { useGlobal } from '@/hooks/useGlobal';

// Logout is client-side (JWT stateless — nothing to revoke server-side).
export function NavAccount() {
	const { isMobile } = useSidebar();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { account, update } = useGlobal();

	// Platform admin is URL-reachable by design (/admin) — this is its one
	// in-app door. Hidden on admin-platform paths (the item would point at the
	// shell you are already in); the workspace app and the personal shell
	// both show it. The API re-checks isAdmin per request regardless.
	const showAdmin =
		(account?.isAdmin ?? false) && !pathname.startsWith('/admin');

	const displayName = account?.name ?? 'Guest';
	const displayEmail = account?.email ?? 'Not signed in';

	const handleLogout = () => {
		update({ token: null, account: null, workspace: null });
		void navigate({ to: '/login' });
	};

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<TitleBlock
									variant="profile"
									title={displayName}
									description={displayEmail}
								/>
								<MoreVertical className="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							side={isMobile ? 'bottom' : 'right'}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<TitleBlock
										variant="profile"
										title={displayName}
										description={displayEmail}
									/>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{/* The personal shell (Account / LLM providers / the
								workspace picker) is reachable from every non-admin
								surface. The Admin item is the reverse door —
								platform surfaces, admins only; hidden while one is
								already in /admin. */}
							<DropdownMenuGroup>
								{showAdmin && (
									<DropdownMenuItem
										onClick={() =>
											void navigate({ to: '/admin' })
										}
									>
										<ShieldCheckIcon />
										Admin
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onClick={() =>
										void navigate({ to: '/personal' })
									}
								>
									<UserIcon />
									Personal
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuGroup>
								<DropdownMenuItem onClick={handleLogout}>
									<LogOut />
									Log out
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</>
	);
}
