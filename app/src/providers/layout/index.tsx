import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, type NavGroupConfig } from './Sidebar';
import { SiteHeader } from './Header';

type IPropsType = {
	children: React.ReactNode;
	/** Sidebar navigation groups — supplied by the shell (personal vs
	 * workspace, see ./nav). */
	navGroups: NavGroupConfig[];
	/** App bar controls before the theme toggle (workspace switcher — workspace
	 * shell only). */
	headerRight?: React.ReactNode;
};

export const LayoutProvider = ({
	children,
	navGroups,
	headerRight,
}: IPropsType) => {
	return (
		<SidebarProvider
			style={
				{
					'--sidebar-width': 'calc(var(--spacing) * 72)',
					'--header-height': 'calc(var(--spacing) * 14)',
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" navGroups={navGroups} />
			<SidebarInset>
				<SiteHeader headerRight={headerRight} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 p-4 md:gap-6 md:py-6">
							{children}
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};
