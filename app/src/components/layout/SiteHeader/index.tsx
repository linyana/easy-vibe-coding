import { ArrowLeftIcon, InfoIcon } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useIsMobile } from '@/hooks';
import { usePageHeaderStore } from '@/hooks/usePageHeader';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

// The app bar: title/back/description via usePageHeader; page actions stay in
// the page body; pages don't render their own headers.
export function SiteHeader() {
	const mobile = useIsMobile();
	const { title, description, back } = usePageHeaderStore((s) => s.content);

	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				{mobile && <SidebarTrigger size="icon" className="-ml-1" />}
				{back ? (
					<Button
						asChild
						variant="ghost"
						size="icon-lg"
						className="-ml-1"
					>
						<Link to={back.to} aria-label={back.label ?? 'Back'}>
							<ArrowLeftIcon className="size-5" />
						</Link>
					</Button>
				) : null}
				{title ? (
					<h1 className="min-w-0 truncate text-2xl font-semibold">
						{title}
					</h1>
				) : null}
				{description ? (
					<TooltipProvider delayDuration={0}>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									aria-label={
										typeof description === 'string'
											? description
											: 'Page description'
									}
									className="rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
								>
									<InfoIcon className="size-5" />
								</button>
							</TooltipTrigger>
							<TooltipContent>{description}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				) : null}
				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
