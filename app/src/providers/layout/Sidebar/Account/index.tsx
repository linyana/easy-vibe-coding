import { useState } from 'react';
import {
	BotIcon,
	ExternalLinkIcon,
	LogOut,
	MoreVertical,
	SettingsIcon,
	ShieldCheckIcon,
	UserIcon,
} from 'lucide-react';
import { useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { TitleBlock } from '@/components/data/TitleBlock';
import { Card, Dialog } from '@/components';
import { cn } from '@/libs/utils';
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
import { LlmProvidersSettings } from '@/pages/LLM';
import { AccountIdentity } from '@/pages/Personal/Account/Identity';

// Logout is client-side (JWT stateless — nothing to revoke server-side).
export function NavAccount() {
	const { isMobile } = useSidebar();
	const navigate = useNavigate();
	const router = useRouter();
	const { pathname } = useLocation();
	const { account, update } = useGlobal();
	const [settingsOpen, setSettingsOpen] = useState(false);

	// Platform admin is URL-reachable by design (/admin) — this item is its
	// one in-app entry, opening the surface in a new tab. Hidden on
	// admin-platform paths (the item would point at the shell you are already
	// in); the workspace app and the personal shell both show it. The API
	// re-checks isAdmin per request regardless.
	const showAdmin =
		(account?.isAdmin ?? false) && !pathname.startsWith('/admin');

	const displayName = account?.name ?? 'Guest';
	const displayEmail = account?.email ?? 'Not signed in';

	const handleLogout = () => {
		update({ token: null, account: null, workspace: null });
		void navigate({ to: '/login' });
	};

	// Admin is the separate platform surface — the item opens it in a NEW TAB
	// (a blocked popup falls back to the current tab).
	const handleAdminOpen = () => {
		const href = router.buildLocation({ to: '/admin' }).href;
		const opened = window.open(href, '_blank');
		if (opened) {
			opened.opener = null;
			return;
		}
		void navigate({ to: '/admin' });
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
							{/* Settings opens the account popup — the Profile and
								LLM providers tabs mirror the personal shell's
								pages. Admin is the platform door — admins only,
								hidden while one is already in /admin. */}
							<DropdownMenuGroup>
								{showAdmin && (
									<DropdownMenuItem onClick={handleAdminOpen}>
										<ShieldCheckIcon />
										Admin
										{/* Exit cue — admin is the separate platform surface,
											URL-reachable by design. */}
										<ExternalLinkIcon className="ml-auto size-3.5 text-muted-foreground" />
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onClick={() => setSettingsOpen(true)}
								>
									<SettingsIcon />
									Settings
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
			<SettingsDialog
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
			/>
		</>
	);
}

const SETTINGS_TABS = [
	{ id: 'profile', title: 'Profile', icon: UserIcon },
	{ id: 'llm', title: 'LLM providers', icon: BotIcon },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]['id'];

// The account quick-settings popup — the same surfaces the personal shell's
// pages mount, without the shell chrome: the Profile tab reuses the Account
// page's identity card, the LLM providers tab the LlmProvidersSettings
// surface (dialogs included). Content pane scrolls under the fixed tabs.
function SettingsDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [tab, setTab] = useState<SettingsTab>('profile');

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			icon={{ name: 'Settings' }}
			title="Settings"
			description="Your account and saved LLM providers."
			contentClassName="h-[80vh] overflow-hidden grid-rows-[auto_minmax(0,1fr)] sm:max-w-none sm:w-[min(80vw,1200px)]"
		>
			<div className="flex min-h-0 flex-col gap-4 overflow-hidden sm:flex-row sm:gap-0">
				<nav
					aria-label="Settings sections"
					className="flex shrink-0 gap-1 sm:w-52 sm:flex-col sm:border-r sm:border-border sm:pr-4"
				>
					{SETTINGS_TABS.map(({ id, title, icon: Icon }) => (
						<button
							key={id}
							type="button"
							aria-current={tab === id ? 'page' : undefined}
							onClick={() => setTab(id)}
							className={cn(
								'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
								tab === id
									? 'bg-sidebar-accent text-sidebar-accent-foreground'
									: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
							)}
						>
							<Icon className="size-4" />
							{title}
						</button>
					))}
				</nav>
				<div className="min-h-0 flex-1 overflow-y-auto sm:pl-4">
					{tab === 'profile' ? (
						<Card description="Your sign-in identity.">
							<AccountIdentity />
						</Card>
					) : (
						<LlmProvidersSettings />
					)}
				</div>
			</div>
		</Dialog>
	);
}
