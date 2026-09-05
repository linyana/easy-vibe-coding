import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SiteHeader } from '@/components/layout/SiteHeader';

type IPropsType = {
	children: React.ReactNode;
	/**
	 * Sidebar to render — defaults to the app sidebar (workspace surface).
	 * The admin shell passes its own AdminSidebar (platform surface).
	 */
	sidebar?: React.ReactNode;
};

export const LayoutProvider = ({ children, sidebar }: IPropsType) => {
	return (
		<SidebarProvider
			style={
				{
					'--sidebar-width': 'calc(var(--spacing) * 72)',
					'--header-height': 'calc(var(--spacing) * 15)',
				} as React.CSSProperties
			}
		>
			{sidebar ?? <AppSidebar variant="inset" />}
			<SidebarInset>
				<SiteHeader />
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
