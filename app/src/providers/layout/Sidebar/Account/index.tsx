import { LogOut, MoreVertical, Settings2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
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
	const { account, update } = useGlobal();

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
							<DropdownMenuGroup>
								{/* The profile shell holds the account-level pages
									plus the workspace picker — available from every
									surface (app / admin / profile). */}
								<DropdownMenuItem
									onClick={() =>
										void navigate({ to: '/profile' })
									}
								>
									<Settings2 />
									Profile
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
