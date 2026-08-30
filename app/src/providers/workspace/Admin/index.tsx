import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, ShieldCheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Admin is platform-level and orthogonal to workspace context, so it never
// goes in the app sidebar's nav — every workspace-selection surface offers
// the console entry identically instead.
export function AdminConsoleEntry() {
	return (
		<Button
			asChild
			variant="outline"
			className="h-auto w-full justify-between px-4 py-3"
		>
			<Link to="/admin" className="flex items-center gap-3">
				<span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
					<ShieldCheckIcon className="size-4" />
				</span>
				<span className="min-w-0 flex-1 text-left leading-tight">
					<span className="block truncate text-sm font-medium">
						Admin console
					</span>
					<span className="block truncate text-xs text-muted-foreground">
						Platform management — accounts and workspaces
					</span>
				</span>
				<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
			</Link>
		</Button>
	);
}
